import { createSlice } from '@reduxjs/toolkit';
import { notification } from 'antd';
import { updateTransfersStatus } from "./thunks";

export const transfersSlice = createSlice({
  name: 'transfers',
  initialState: [],
  reducers: {
    setTransfers: (_, action) => {
      return action.payload;
    },
    addTransfer: (state, action) => {
      state.push(action.payload);
    },
    claimMyself: (state, action) => {
      // payload type: 
      // { 
      //   txid: String,
      //   claim_num?: number | String,
      //   txts: Number
      // }

      const transfer = state.find(t => t.txid === action.payload.txid);

      if (!transfer)
        throw Error(`transfer not found in claimMyself ${action.payload.txid}`);

      transfer.self_claimed = Date.now();

      if (action.payload.claim_num) {
        transfer.self_claimed_num = action.payload.claim_num;
      }

    },
    updateTransferStatus: (state, action) => {
      const transfer = state.find(t => t.txid === action.payload.txid);
      if (!transfer)
        throw Error(`transfer not found in updateTransferStatus ${action.payload.txid}`);
      transfer.status = action.payload.status;
      if (action.payload.new_txid) // replaced by upping the gas price
        transfer.txid = action.payload.new_txid;
      if (action?.payload?.claim_txid){
        transfer.claim_txid = action.payload.claim_txid;
      }
      if (action?.payload?.ts_confirmed) {
        transfer.ts_confirmed = action.payload.ts_confirmed;
      }
      if (action?.payload?.expiry_ts) {
        transfer.expiry_ts = action.payload.expiry_ts;
      }
      if (action?.payload?.txts) {
        transfer.txts = action.payload.txts;
      }
    },
    withdrawalConfirmed: (state, action) => {
      const transfer = state.find(t => t.txid === action.payload.txid);

      if (!transfer)
        throw Error(`transfer not found in updateTransferStatus ${action.payload.txid}`);

      transfer.is_finished = 1;
    },
    updateExpireTs: (state, action) => {
      const transfer = state.find(t => t.txid === action.payload.txid);

      if (!transfer)
        throw Error(`transfer not found in updateTransferStatus ${action.payload.txid}`);

      transfer.expiry_ts = action.payload.expiry_ts;
    },
    updateTxts: (state, action) => {
      const transfer = state.find(t => t.txid === action.payload.txid);

      if (!transfer)
        throw Error(`transfer not found in updateTransferStatus ${action.payload.txid}`);

      transfer.txts = action.payload.txts;
    },
  },
  extraReducers: {
    [updateTransfersStatus.fulfilled]: (state, action) => {
      const listWithChangeInStatus = action.payload;
      listWithChangeInStatus?.forEach(({ txid, status, claim_txid, is_finished, claim_num }) => {
        const transferIndex = state.findIndex(t => t.txid === txid);
        state[transferIndex].status = status;
        if (claim_txid){
          state[transferIndex].claim_txid = claim_txid;
        }

        if (is_finished) {
          state[transferIndex].is_finished = is_finished;
        }

        if (state[transferIndex].self_claimed && claim_num && !state[transferIndex].self_claimed_num) {
          state[transferIndex].self_claimed_num = claim_num;
        }
      })
    },
    [updateTransfersStatus.rejected]: () => {
      notification.open({
        message: 'Transfer statuses update error',
        type: "error"
      })
    },
  }
});

export const { setTransfers, addTransfer, updateTransferStatus, updateTransfersStatuses, claimMyself, withdrawalConfirmed, updateExpireTs, updateTxts } = transfersSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
export const selectTransfers = (state) => state.transfers

export const selectTransferById = (state, txid) => state.transfers.find((t) => t.txid === txid);

export default transfersSlice.reducer;
