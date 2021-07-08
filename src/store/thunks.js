import { getBridges, getTransferStatus } from "services/api";
import { startWatchingDestinationBridge } from "services/watch";
import { getOrInsertInput } from "utils";
import { setDirections } from "./directionsSlice";
import obyte from "../services/socket";

const { createAsyncThunk } = require("@reduxjs/toolkit")

export const updateTransfersStatus = createAsyncThunk(
  'updateTransfersStatus',
  async (_, thunkAPI) => {
    const { transfers } = thunkAPI.getState();
    const getStatusList = [];
    const subscriptions = [];
    transfers.forEach((tr) => {
      if (!(tr.status === "claim_confirmed") || (("self_claimed" in tr) && !Number(tr.is_finished))) {
        if ("dst_bridge_aa" in tr) {
          subscriptions.push(startWatchingDestinationBridge(tr.dst_token.network, tr.dst_bridge_aa))
        }
        getStatusList.push(getTransferStatus(tr.txid).then((data => ({ txid: tr.txid, status: data?.status || tr.status, claim_txid: data?.claim_txid, type: data?.type || tr.type, is_finished: data?.is_finished, claim_num: data?.claim_num }))))
      }
    })
    await Promise.all(subscriptions);
    return await Promise.all(getStatusList);
  }
);

export const getObyteGovernanceParams = createAsyncThunk(
  'getGovernanceParams',
  async (_, thunkAPI) => {

    // const import_aa = process.env.REACT_APP_OBYTE_IMPORT_AA;
    // const export_aa = process.env.REACT_APP_OBYTE_EXPORT_AA;

    // const importDef = await client.api.getDefinition(import_aa);
    // const exportDef = await client.api.getDefinition(export_aa);
  }
);

export const getCoinIcons = createAsyncThunk(
  'getCoinIcons',
  async () => {
    let list = [];
    const response = await fetch(`${process.env.REACT_APP_ICON_CDN_URL}/list.json`);

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
    const bridges = resp.data;
    let directions = {};
    let inputs = [];
    for (let { bridge_id, home_network, home_asset, stake_asset, home_asset_decimals, home_symbol, export_aa, foreign_network, foreign_asset, foreign_asset_decimals, foreign_symbol, import_aa, min_expatriation_reward, min_repatriation_reward, count_expatriation_claimants, count_repatriation_claimants, max_expatriation_amount, max_repatriation_amount } of bridges) {
      const home_token = { network: home_network, asset: home_asset, decimals: home_asset_decimals, symbol: home_symbol };
      const foreign_token = { network: foreign_network, asset: foreign_asset, decimals: foreign_asset_decimals, symbol: foreign_symbol };
      directions[export_aa] = {
        bridge_id,
        type: 'expatriation',
        src_bridge_aa: export_aa,
        dst_bridge_aa: import_aa,
        src_token: home_token,
        dst_token: foreign_token,
        stake_asset
      };
      directions[import_aa] = {
        bridge_id,
        type: 'repatriation',
        src_bridge_aa: import_aa,
        dst_bridge_aa: export_aa,
        src_token: foreign_token,
        dst_token: home_token,
        stake_asset
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
    }
    thunkAPI.dispatch(setDirections(directions));
    return inputs.map((i, index) => ({ index, ...i, destinations: i.destinations.map((d, id) => ({ ...d, index: id })) }));
  }
);

export const getBridgesParams = createAsyncThunk(
  'update/getBridgesParams',
  async () => {
    const import_base_aa = process.env.REACT_APP_OBYTE_IMPORT_BASE_AA;
    const export_base_aa = process.env.REACT_APP_OBYTE_EXPORT_BASE_AA;

    const import_aas = await obyte.api.getAasByBaseAas({
      base_aa: import_base_aa
    });

    const export_aas = await obyte.api.getAasByBaseAas({
      base_aa: export_base_aa
    });

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