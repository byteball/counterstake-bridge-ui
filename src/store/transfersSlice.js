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
    updateTransferStatus: (state, action) => {
      const transfer = state.find(t => t.txid === action.payload.txid);
      if (!transfer)
        throw Error(`transfer not found in updateTransferStatus ${action.payload.txid}`);
      transfer.status = action.payload.status;
      if (action?.payload?.claim_txid){
        transfer.claim_txid = action.payload.claim_txid;
      }
    },
  },
  extraReducers: {
    [updateTransfersStatus.fulfilled]: (state, action) => {
      const listWithChangeInStatus = action.payload;
      listWithChangeInStatus?.forEach(({ txid, status, claim_txid }) => {
        const transferIndex = state.findIndex(t => t.txid === txid);
        state[transferIndex].status = status;
        if (claim_txid){
          state[transferIndex].claim_txid = claim_txid;
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

export const { setTransfers, addTransfer, updateTransferStatus, updateTransfersStatuses } = transfersSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
export const selectTransfers = (state) => state.transfers

export const selectTransferById = (state, txid) => state.transfers.find((t) => t.txid === txid);

export default transfersSlice.reducer;
