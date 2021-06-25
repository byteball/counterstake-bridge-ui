import socket from "./socket";
import { startWatchingContractForClaims } from "./evm";

export const startWatchingSourceBridge = async (src_network, src_bridge_aa) => {
  if (src_network === 'Obyte') {
    await socket.justsaying("light/new_aa_to_watch", { aa: src_bridge_aa });
  }
  else
    throw Error(`we don't need to watch the bridge on the source side when sending from Ethereum or BSC`);
};

export const startWatchingDestinationBridge = async (dst_network, dst_bridge_aa) => {
  if (dst_network === 'Obyte') {
    await socket.justsaying("light/new_aa_to_watch", { aa: dst_bridge_aa });
  }
  else {
    startWatchingContractForClaims(dst_network, dst_bridge_aa);
  }
};

