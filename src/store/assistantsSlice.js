import { createSlice } from '@reduxjs/toolkit';

import { loadAssistants } from './thunks/loadAssistants';
import { getBalanceOfObyteWallet } from './thunks/getBalanceOfObyteWallet';
import { updateAllEvmAssistants } from './thunks/updateAllEvmAssistants';
import { updateEvmAssistant } from './thunks/updateEvmAssistant';

export const assistantsSlice = createSlice({
  name: 'assistants',
  initialState: {
    loaded: false,
    assistants: {},
    forwards: [],
    balanceOfMyObyteWallet: {},
    homeTokens: {},
    managers: [],
    sharesSymbols: []
  },
  reducers: {
    reqToCreateForward: (state, action) => {
      const assistant_address = action.payload;
      const bridges = Object.keys(state.assistants);
      const bridgeByAssistant = bridges.find((b) => state.assistants[b]?.findIndex((a) => a.assistant_aa === assistant_address) >= 0)
      const assistant = state.assistants[bridgeByAssistant]?.find((a) => a.assistant_aa === assistant_address);
      if (assistant) {
        assistant.forward_status = "stabilization";
      } else {
        console.error("reqToCreateForward: ", assistant_address, " not found")
      }
    },
    saveForward: (state, action) => {
      const { assistant_address, forward } = action.payload;
      const bridges = Object.keys(state.assistants);
      const bridgeByAssistant = bridges.find((b) => state.assistants[b]?.findIndex((a) => a.assistant_aa === assistant_address) >= 0)
      const assistant = state.assistants[bridgeByAssistant]?.find((a) => a.assistant_aa === assistant_address);
      if (assistant) {
        assistant.forward = forward;
      } else {
        console.error("saveForward: ", assistant_address, " not found")
      }
    },
    updateObyteAssistant: (state, action) => {
      const { address, diff, balances } = action.payload;

      const bridges = Object.keys(state.assistants);
      const bridgeByAssistant = bridges.find((b) => state.assistants[b]?.findIndex((a) => a.assistant_aa === address) >= 0)
      const assistant = state.assistants[bridgeByAssistant]?.find((a) => a.assistant_aa === address);

      if (assistant) {
        if (assistant.side === "export") {
          if ("mf" in diff) {
            assistant.stake_mf = diff.mf;
          }

          if ("ts" in diff) {
            assistant.ts = diff.ts;
          }

          if ("balance_in_work" in diff) {
            assistant.stake_balance_in_work = diff.balance_in_work;
          }

          if ("shares_supply" in diff) {
            assistant.shares_supply = diff.shares_supply;
          }

          if ("profit" in diff) {
            assistant.stake_profit = diff.profit;
            assistant.stake_sf = Math.max(Math.floor(diff.profit * assistant.cacheParams.success_fee), 0);
          }

          if (assistant.stake_asset in balances) {
            assistant.stake_balance = balances[assistant.stake_asset] || 0;
          }

        } else {
          if ("mf" in diff) {
            assistant.stake_mf = diff.mf.stake;
            assistant.image_mf = diff.mf.image;
            assistant.ts = diff.mf.ts;
          }

          if ("stake_profit" in diff) {
            assistant.stake_sf = Math.max(Math.floor(diff.stake_profit * assistant.cacheParams.success_fee), 0);
            assistant.stake_profit = diff.stake_profit;
          }

          if ("image_profit" in diff) {
            assistant.image_sf = Math.max(Math.floor(diff.image_profit * assistant.cacheParams.success_fee), 0);
            assistant.image_profit = diff.image_profit;
          }

          if ("stake_balance_in_work" in diff) {
            assistant.stake_balance_in_work = diff.stake_balance_in_work;
          }

          if ("image_balance_in_work" in diff) {
            assistant.image_balance_in_work = diff.image_balance_in_work;
          }

          if (assistant.stake_asset in balances) {
            assistant.stake_balance = balances?.[assistant.stake_asset];
          }

          if (assistant.image_asset in balances) {
            assistant.image_balance = balances?.[assistant.image_asset];
          }
        }
      }
    }
  },
  extraReducers: {
    [loadAssistants.fulfilled]: (state, action) => {
      if (action.payload) {
        state.assistants = action.payload.assistants;
        state.forwards = action.payload.forwards;
        state.homeTokens = action.payload.homeTokens;
        state.managers = action.payload.managers;
        state.sharesSymbols = action.payload.shares_symbols;
        state.loaded = true;
      }
    },
    [updateEvmAssistant.fulfilled]: (state, action) => {
      const payload = action.payload || {};
      const { assistant_aa: address } = payload;
      if (address) {
        const bridges = Object.keys(state.assistants);
        const bridgeByAssistant = bridges.find((b) => state.assistants[b]?.findIndex((a) => a.assistant_aa === address) >= 0)
        const assistantIndex = state.assistants[bridgeByAssistant]?.findIndex((a) => a.assistant_aa === address);

        if (assistantIndex >= 0) {
          const assistant = state.assistants[bridgeByAssistant][assistantIndex];
          state.assistants[bridgeByAssistant][assistantIndex] = { ...assistant, ...payload };
        }
      }
    },
    [loadAssistants.pending]: (state) => {
      state.loaded = false;
    },
    [getBalanceOfObyteWallet.fulfilled]: (state, { payload }) => {
      state.balanceOfMyObyteWallet = payload;
    },
    [updateAllEvmAssistants.fulfilled]: (state, { payload: updatedInfo }) => {
      updatedInfo?.forEach(({ bridge_aa, ...u }) => {
        const assistant = state.assistants[bridge_aa]?.find((a) => a.assistant_aa === u.assistant_aa);

        Object.keys(u).forEach(name => {
          assistant[name] = u[name];
        })
        
      });
    }
  }
});

export const { reqToCreateForward, saveForward, updateObyteAssistant } = assistantsSlice.actions;

export const selectAssistants = state => state.assistants.assistants;
export const selectBalanceOfObyteWallet = state => state.assistants.balanceOfMyObyteWallet;
export const selectHomeTokens = state => state.assistants.homeTokens;
export const selectManagers = state => state.assistants.managers;
export const selectSharesSymbols = state => state.assistants.sharesSymbols;

export default assistantsSlice.reducer;
