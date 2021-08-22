import { createAsyncThunk } from "@reduxjs/toolkit";
import { BigNumber } from "ethers";

import { EVMBridgeGovernance } from "pages/Governance/utils/EVMBridgeGovernance";
import { getParameterList } from "pages/Governance/utils/getParameterList";
import { parseGovernanceStateVars } from "pages/Governance/utils/parseGovernanceStateVars";
import obyte from "services/socket";
import { getDecimals, getSymbol } from "utils";

export const changeActiveGovernanceAA = createAsyncThunk(
  'update/changeActiveGovernanceAA',
  async (payload, { getState }) => {
    const store = getState();
    const { bridge_aa } = payload;
    const bridge = store.governance.importList?.[bridge_aa] || store.governance.exportList?.[bridge_aa];

    const { network: bridge_network, symbol: bridge_symbol, decimals: bridge_decimals, type, stake_asset, home_asset } = bridge;
    const parameterList = getParameterList(bridge_network);
    const walletAddress = store.destAddress[bridge_network];
    let governanceState = {}; // only for Obyte network
    let def_params = {}; // only for Obyte network

    let challenging_period;
    let freeze_period;
    let governance_aa = null;

    let balances = {};
    let paramsInfo;

    let voteTokenAddress = null;
    let voteTokenDecimals = null;
    let voteTokenSymbol = null;

    let stakeTokenAddress = null;
    let stakeTokenDecimals = null;
    let stakeTokenSymbol = null;

    if (bridge_network === "Obyte") {
      const bridgeState = await obyte.api.getAaStateVars({ address: bridge_aa, var_prefix: 'governance_aa' });
      governance_aa = bridgeState?.governance_aa;
      voteTokenAddress = type === "export" ? home_asset : await obyte.api.getAaStateVars({ address: bridge_aa, var_prefix: 'asset' }).then((data) => data.asset);

      const def = await obyte.api.getDefinition(bridge_aa);
      def_params = def[1].params;

      challenging_period = def_params?.governance_challenging_period || 3 * 24 * 60 * 60;
      freeze_period = def_params?.freeze_period || 30 * 24 * 60 * 60;

      voteTokenDecimals = await getDecimals(voteTokenAddress, bridge_network);
      voteTokenSymbol = await getSymbol(voteTokenAddress, bridge_network);

      stakeTokenAddress = type === 'import' ? stake_asset : home_asset;
      stakeTokenDecimals = await getDecimals(stakeTokenAddress, bridge_network);
      stakeTokenSymbol = await getSymbol(stakeTokenAddress, bridge_network);

      await obyte.justsaying("light/new_aa_to_watch", {
        aa: governance_aa,
      });

      try {
        governanceState = (await obyte.api.getAaStateVars({
          address: governance_aa,
        }));
        let lastKey = "";
        while (true) {
          const chunkData = (await obyte.api.getAaStateVars({
            address: governance_aa,
            var_prefix_from: lastKey
          }));
          const keys = Object.keys(chunkData);
          if (keys.length > 1) {
            governanceState = { ...governanceState, ...chunkData };
            lastKey = keys[keys.length - 1];
          } else {
            break;
          }
        }
      } catch (e) {
        console.log("Error: ", e);
      }

      const data = parseGovernanceStateVars(governanceState, "Obyte", type)

      balances = data.balances;
      paramsInfo = data.paramsInfo;

      Object.keys(paramsInfo).forEach((param) => paramsInfo[param].value = governanceState[param] || def_params[param] || parameterList[param].initValue);

    } else if (bridge_network !== undefined) {
      challenging_period = 10 * 24 * 60 * 60;
      freeze_period = 30 * 24 * 60 * 60;

      const EVM = new EVMBridgeGovernance(bridge_network, bridge_aa, voteTokenDecimals, walletAddress);
      governance_aa = await EVM.getGovernanceContractAddress();

      voteTokenAddress = await EVM.getVotingTokenAddress();

      [voteTokenDecimals, voteTokenSymbol] = await Promise.all([getDecimals(voteTokenAddress, bridge_network), getSymbol(voteTokenAddress, bridge_network)])

      stakeTokenAddress = voteTokenAddress;
      stakeTokenDecimals = voteTokenDecimals;
      stakeTokenSymbol = voteTokenSymbol;

      if (walletAddress && window.ethereum) {
        const balanceBn = await EVM.getBalance(walletAddress);
        balances = {
          [walletAddress]: BigNumber.from(balanceBn).toString()
        }
      }

      paramsInfo = await EVM.initState(type);
    }

    return ({
      selectedAddress: bridge_aa,
      bridge_network,
      bridge_symbol,
      bridge_decimals,
      type,
      governance_aa,
      stakeTokenAddress,
      stakeTokenDecimals,
      stakeTokenSymbol,
      voteTokenAddress,
      voteTokenDecimals,
      voteTokenSymbol,
      governanceState,
      defParams: def_params,
      challenging_period,
      freeze_period,
      balances,
      paramsInfo
    });
  }
)