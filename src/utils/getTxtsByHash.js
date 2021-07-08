import { providers } from "services/evm";
import obyte from "services/socket";

export const getTxtsByHash = async (txid, src_network) => {
  try {
    if (src_network === "Obyte") {
      const resp = await obyte.api.getJoint(txid);
      const { unit: { timestamp } } = resp.joint;
      return timestamp || null;
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