import { getBridges, getTransferStatus } from "services/api";
import { startWatchingDestinationBridge } from "services/watch";
import { getOrInsertInput } from "utils";
import { setDirections } from "./directionsSlice";
import obyte from "../services/socket";
import { setGovernanceList } from "./governanceSlice";
import { updateExportedTokens } from "./settingsSlice";
import config from "appConfig";
import { loadMissedTransfers } from "./thunks/loadMissedTransfers";

const { createAsyncThunk } = require("@reduxjs/toolkit")

export const updateTransfersStatus = createAsyncThunk(
  'updateTransfersStatus',
  async (_, thunkAPI) => {
    const { transfers } = thunkAPI.getState();
    const getStatusList = [];
    const subscriptions = [];
    transfers.forEach((tr) => {
      if (!(tr.status === "claim_confirmed" && (!tr.self_claimed)) || (("self_claimed" in tr) && !Number(tr.is_finished)) || !tr.claimant_address || (tr.claimant_address && (tr.dest_address === tr.claimant_address) && (!tr.self_claimed_num))) {
        if ("dst_bridge_aa" in tr) {
          subscriptions.push(startWatchingDestinationBridge(tr.dst_token.network, tr.dst_bridge_aa))
        }
        getStatusList.push(getTransferStatus(tr.txid).then((data => ({ txid: tr.txid, status: data?.status || tr.status, claim_txid: data?.claim_txid, type: data?.type || tr.type, is_finished: data?.is_finished, claim_num: data?.claim_num, self_claimed_num: ((data?.claimant_address === data?.dest_address) && (data?.claimant_address && data?.dest_address)) ? data?.claim_num : undefined, claimant_address: data?.claimant_address }))))
      }
    })
    await Promise.all(subscriptions);
    return await Promise.all(getStatusList);
  }
);

export const getCoinIcons = createAsyncThunk(
  'getCoinIcons',
  async () => {
    let list = [];
    const response = await fetch(`${config.ICON_CDN_URL}/list.json`);

    if (response.ok) {
      list = await response.json();
    }

    return list
  }
);


export const updateBridges = createAsyncThunk(
  'update/updateBridges',
  async (_, thunkAPI) => {
    const resp = await getBridges();
    if (resp.status !== 'success')
      return [];

    const { governance, directions: lastDirections } = thunkAPI.getState();
    const governanceListExists = Object.keys(governance.exportList || {}).length > 0 || Object.keys(governance.importList || {}).length > 0;

    const bridges = resp.data;
    let directions = {};
    let inputs = [];
    const import_aas = {};
    const export_aas = {};
    const list = [];
    const imported_tokens = {};

    for (let { bridge_id, home_network, home_asset, stake_asset, home_asset_decimals, home_symbol, export_aa, foreign_network, foreign_asset, foreign_asset_decimals, foreign_symbol, import_aa, min_expatriation_reward, min_repatriation_reward, count_expatriation_claimants, count_repatriation_claimants, max_expatriation_amount, max_repatriation_amount } of bridges) {
      const home_token = { network: home_network, asset: home_asset, decimals: home_asset_decimals, symbol: home_symbol, home_network };
      const foreign_token = { network: foreign_network, asset: foreign_asset, decimals: foreign_asset_decimals, symbol: foreign_symbol, home_network };

      if (imported_tokens[home_network]) {
        if (imported_tokens[home_network]?.[foreign_network]) {
          imported_tokens[home_network][foreign_network].push(home_asset);
        } else {
          imported_tokens[home_network][foreign_network] = [home_asset];
        }
      } else {
        imported_tokens[home_network] = {
          [foreign_network]: [home_asset]
        }
      }

      if (!foreign_symbol) continue;

      directions[export_aa] = {
        bridge_id,
        type: 'expatriation',
        src_bridge_aa: export_aa,
        dst_bridge_aa: import_aa,
        src_token: home_token,
        dst_token: foreign_token,
        stake_asset,
        home_asset,
        home_network,
        home_symbol
      };
      directions[import_aa] = {
        bridge_id,
        type: 'repatriation',
        src_bridge_aa: import_aa,
        dst_bridge_aa: export_aa,
        src_token: foreign_token,
        dst_token: home_token,
        stake_asset,
        home_asset,
        home_network,
        home_symbol
      };
      const home_input = getOrInsertInput(inputs, home_token);
      home_input.destinations.push({
        bridge_id,
        type: 'expatriation',
        src_bridge_aa: export_aa,
        dst_bridge_aa: import_aa,
        min_reward: min_expatriation_reward,
        count_claimants: count_expatriation_claimants,
        token: foreign_token,
        max_amount: max_expatriation_amount
      });
      const foreign_input = getOrInsertInput(inputs, foreign_token);
      foreign_input.destinations.push({
        bridge_id,
        type: 'repatriation',
        src_bridge_aa: import_aa,
        dst_bridge_aa: export_aa,
        min_reward: min_repatriation_reward,
        count_claimants: count_repatriation_claimants,
        token: home_token,
        max_amount: max_repatriation_amount
      });
      if (!governanceListExists) {
        import_aas[import_aa] = { ...foreign_token, type: "import", stake_asset, home_asset, home_asset_decimals, bridge_aa: import_aa, foreign_network };
        export_aas[export_aa] = { ...home_token, type: "export", stake_asset, home_asset, home_asset_decimals, foreign_asset, bridge_aa: export_aa, foreign_network };
        list.push({
          import: import_aa,
          export: export_aa,
          bridge_label: `${home_token.symbol}: ${home_token.network} -> ${foreign_token.network}`
        })
      }
    }

    thunkAPI.dispatch(setDirections(directions)); // logic from getDirectionsByBridgesInfo(bridgesInfo);  

    if (!governanceListExists) {
      thunkAPI.dispatch(setGovernanceList({ import_aas, export_aas, list: list.sort((a, b) => compare(a.bridge_label, b.bridge_label)) }));
    }

    thunkAPI.dispatch(updateExportedTokens(imported_tokens));

    if (!lastDirections) {
      thunkAPI.dispatch(loadMissedTransfers(directions));
    }

    return inputs.map((i, index) => ({ index, ...i, destinations: i.destinations.map((d, id) => ({ ...d, index: id })) }));
  }
);

export const getBridgesParams = createAsyncThunk(
  'update/getBridgesParams',
  async () => {
    const import_base_aas = config.OBYTE_IMPORT_BASE_AAS;
    const export_base_aas = config.OBYTE_EXPORT_BASE_AAS;


    let import_aas = [];
    let export_aas = [];

    await Promise.all(import_base_aas.map(base_aa => obyte.api.getAasByBaseAas({ base_aa }).then(aas => import_aas = [...import_aas, ...aas])));
    await Promise.all(export_base_aas.map(base_aa => obyte.api.getAasByBaseAas({ base_aa }).then(aas => export_aas = [...export_aas, ...aas])));

    const importParams = {};
    const exportParams = {};

    import_aas.forEach((a) => importParams[a.address] = a.definition[1].params);
    export_aas.forEach((a) => exportParams[a.address] = a.definition[1].params);

    return {
      importParams,
      exportParams
    }
  }
)

const compare = (a, b) => {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else if (a === b) {
    return 0;
  }
}