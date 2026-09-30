import { createSlice } from '@reduxjs/toolkit';
import { BigNumber } from 'ethers';

import { getParameterList } from 'pages/Governance/utils/getParameterList';
import { parseGovernanceStateVars } from 'pages/Governance/utils/parseGovernanceStateVars';
import { changeActiveGovernanceAA } from './thunks/changeActiveGovernanceAA';
import { updateActiveGovernanceAA } from './thunks/updateActiveGovernanceAA';

export const isPositiveAmount = (value) => {
  if (value === null || value === undefined) return false;
  try {
    return !BigNumber.from(value).isZero();
  } catch (e) {
    return false;
  }
}

const initialState = {
  loading: undefined,
  exportList: {},
  importList: {},
  selectedBridgeAddress: null,
  bridge_network: null,
  bridge_symbol: null,
  bridge_decimals: null,
  activeGovernance: null,
  type: null,
  stakeTokenAddress: null,
  stakeTokenDecimals: null,
  stakeTokenSymbol: null,
  voteTokenAddress: null,
  voteTokenDecimals: null,
  voteTokenSymbol: null,
  governanceState: {}, // only for Obyte network (cache)
  defParams: {}, // only for Obyte network (cache)
  balances: {},
  paramsInfo: {},
  list: [],
  governanceAddresses: {}, // { [bridge_aa]: governance contract/AA }
  lockedBalances: {}, // { [bridge_aa]: raw amount } — the user's deposit per governance contract
  lockedBalancesWalletsKey: null, // fingerprint of the wallets the last load read for
}
export const governanceSlice = createSlice({
  name: 'governance',
  initialState,
  reducers: {
    setGovernanceList: (state, action) => {
      state.exportList = action.payload.export_aas
      state.importList = action.payload.import_aas
      state.list = action.payload.list
    },
    changeGovernanceState: (state, action) => {
      if (state.bridge_network !== "Obyte") return null;

      const variables = action.payload;
      const newState = { ...state.governanceState, ...variables };
      for (const var_name in variables) {
        if (variables[var_name] === undefined || variables[var_name] === false) {
          delete newState[var_name];
        }
      }

      state.governanceState = newState;

      const data = parseGovernanceStateVars(newState, "Obyte", state.type)

      const balances = data.balances;
      const paramsInfo = data.paramsInfo;

      const parameterList = getParameterList(state.bridge_network);

      Object.keys(paramsInfo).forEach((param) => paramsInfo[param].value = newState[param] || state.defParams[param] || parameterList[param].initValue);

      state.balances = balances;
      state.paramsInfo = paramsInfo;
    },
    // other wallets: clean slate; same wallets: keep the values while re-reading
    lockedBalancesLoadStarted: (state, action) => {
      const walletsKey = action.payload;
      if (walletsKey !== state.lockedBalancesWalletsKey) state.lockedBalances = {};
      state.lockedBalancesWalletsKey = walletsKey;
    },
    // results that arrive for wallets other than the current ones are dropped
    updateLockedBalances: (state, action) => {
      const { walletsKey, balances } = action.payload;
      if (walletsKey === state.lockedBalancesWalletsKey) Object.assign(state.lockedBalances, balances);
    },
    setGovernanceAddresses: (state, action) => {
      Object.assign(state.governanceAddresses, action.payload);
    },
    applyCommit: (state, action) => {
      const name = action.payload;
      state.paramsInfo[name].value = state.paramsInfo[name].leader;
    },
    applyRemove: (state, action) => {
      const { name, wallet } = action.payload;
      const leader = state.paramsInfo[name].leader;

      if (state.paramsInfo[name].choices[wallet] !== leader) {
        delete state.paramsInfo[name].supports[leader];
      }

      delete state.paramsInfo[name].choices[wallet];
    },
    applyWithdraw: (state, action) => {
      const { amount, wallet } = action.payload;
      if (amount) {
        state.balances[wallet] = BigNumber.from(state.balances[wallet]).sub(BigNumber.from(amount)).toString()
      } else {
        delete state.balances[wallet]
      }
    }

  },
  extraReducers: {
    [changeActiveGovernanceAA.fulfilled]: (state, action) => {
      state.selectedBridgeAddress = action.payload.selectedBridgeAddress;
      state.bridge_network = action.payload.bridge_network;
      state.bridge_symbol = action.payload.bridge_symbol;
      state.bridge_decimals = action.payload.bridge_decimals;
      state.type = action.payload.type;
      state.activeGovernance = action.payload.governance_aa;

      state.stakeTokenAddress = action.payload.stakeTokenAddress;
      state.stakeTokenDecimals = action.payload.stakeTokenDecimals;
      state.stakeTokenSymbol = action.payload.stakeTokenSymbol;

      state.voteTokenAddress = action.payload.voteTokenAddress;
      state.voteTokenDecimals = action.payload.voteTokenDecimals;
      state.voteTokenSymbol = action.payload.voteTokenSymbol;

      state.governanceState = action.payload.governanceState || {};
      state.defParams = action.payload.defParams || {};
      state.challenging_period = action.payload.challenging_period;
      state.freeze_period = action.payload.freeze_period;
      state.balances = action.payload.balances;
      state.paramsInfo = action.payload.paramsInfo;
      state.loading = false;

      state.home_asset_decimals = action.payload.home_asset_decimals;

      if (action.payload.governance_aa) state.governanceAddresses[action.payload.selectedBridgeAddress] = action.payload.governance_aa;
    },
    [changeActiveGovernanceAA.pending]: (state) => {
      state.loading = true
      state.selectedBridgeAddress = null
    },
    [updateActiveGovernanceAA.fulfilled]: (state, action) => {
      state.balances = action.payload.balances;
      state.paramsInfo = action.payload.paramsInfo;
    }
  }
});

export const {
  setGovernanceList,
  changeGovernanceState,
  applyCommit,
  applyRemove,
  applyWithdraw,
  lockedBalancesLoadStarted,
  updateLockedBalances,
  setGovernanceAddresses,
} = governanceSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
export const selectBridgeAAs = state => ({ ...state?.governance?.exportList, ...state?.governance?.importList });

export const selectGovernanceActive = state => state.governance.selectedBridgeAddress;

export const selectGovernance = state => state.governance;

export const selectList = state => state.governance.list;

export const selectLockedBalances = state => state.governance.lockedBalances;

export default governanceSlice.reducer;
