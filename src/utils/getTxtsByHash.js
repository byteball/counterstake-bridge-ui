import { getTransferStatus } from "services/api";
import { providers } from "services/evm";
import { store } from "index";
import { updateTxts } from "store/transfersSlice";

export const getTxtsByHash = async (txid, src_network) => {
  try {
    if (src_network === "Obyte") {
      const dispatch = store.dispatch;
      const resp = await getTransferStatus(txid);
      if (resp?.txts) {
        dispatch(updateTxts({ txid, txts: resp?.txts }))
      }
      return resp?.txts || null
    } else {
      const transaction = await providers[src_network].getTransaction(txid);
      const blockHash = transaction?.blockHash;
      const block = blockHash && await providers[src_network].getBlock(blockHash);
      return block?.timestamp || null;
    }
  } catch (e) {
    console.log("getTxtsByHash", e)
    return null;
  }
}