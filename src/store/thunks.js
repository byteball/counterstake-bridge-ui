import { getTransferStatus } from "services/api";
import { startWatchingDestinationBridge } from "services/watch";

const { createAsyncThunk } = require("@reduxjs/toolkit")

export const updateTransfersStatus = createAsyncThunk(
  'updateTransfersStatus',
  async (_, thunkAPI) => {
    const { transfers } = thunkAPI.getState();
    const getStatusList = [];
    const subscriptions = [];
    transfers.forEach((tr) => {
      if (!((tr.src_token.network === "Obyte" && tr.status === "claimed") || ((tr.src_token.network === "Ethereum" || tr.src_token.network === "BSC") && tr.status === "claim_confirmed"))) {
        if ("dst_bridge_aa" in tr) {
          subscriptions.push(startWatchingDestinationBridge(tr.dst_token.network, tr.dst_bridge_aa))
        }
        getStatusList.push(getTransferStatus(tr.txid).then((data => ({ txid: tr.txid, status: data || tr.status }))))
      }
    })
    await Promise.all(subscriptions);
    return await Promise.all(getStatusList);
  }
);

export const getObyteGovernanceParams = createAsyncThunk(
  'updateTransfersStatus',
  async (_, thunkAPI) => {

    // const import_aa = process.env.REACT_APP_OBYTE_IMPORT_AA;
    // const export_aa = process.env.REACT_APP_OBYTE_EXPORT_AA;

    // const importDef = await client.api.getDefinition(import_aa);
    // const exportDef = await client.api.getDefinition(export_aa);
  }
);