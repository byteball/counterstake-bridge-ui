import socket from "./socket";
import { startWatchingContractForClaims } from "./evm";


export const startWatchingSourceBridge = async (src_token) => {
  if (src_token.network === 'Obyte') {
    await socket.justsaying("light/new_aa_to_watch", { aa: src_token.bridge_aa });
  }
  else
    throw Error(`we don't need to watch the bridge on the source side when sending from Ethereum or BSC`);
};

export const startWatchingDestinationBridge = async (dst_token) => {
  if (dst_token.network === 'Obyte') {
    await socket.justsaying("light/new_aa_to_watch", { aa: dst_token.bridge_aa });
  }
  else {
    startWatchingContractForClaims(dst_token);
  }
};

