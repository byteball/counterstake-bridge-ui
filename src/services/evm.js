import { BigNumber, ethers } from "ethers";

import { claimMyself, updateTransferStatus } from "store/transfersSlice";
import { store } from "index";
import { rpcUrls } from "rpcUrls";
import { chainIds } from "chainIds";
import { JsonRpcProviderWithFallback } from "./JsonRpcProviderWithFallback";

const environment = process.env.REACT_APP_ENVIRONMENT;
const env = environment === 'devnet' ? 'devnet' : environment === 'testnet' ? 'testnet' : 'mainnet';

function createProvider(network) {
  const urls = rpcUrls[network]?.[env];

  if (!urls || urls.length === 0) return null;

  const chainId = chainIds[env]?.[network];

  if (urls.length === 1) {
    return new ethers.providers.StaticJsonRpcProvider(urls[0], chainId);
  }

  return new JsonRpcProviderWithFallback(urls, chainId);
}

export const providers = Object.fromEntries(
  Object.keys(rpcUrls).map(network => [network, createProvider(network)])
);

const counterstakeAbi = [
  "event NewClaim(uint indexed claim_num, address author_address, string sender_address, address recipient_address, string txid, uint32 txts, uint amount, int reward, uint stake, string data, uint32 expiry_ts)"
];

const watchedContracts = {};

const onNewClaim = (claim_num, author_address, sender_address, recipient_address, txid, txts, amount, reward, stake, data, expiry_ts, event) => {
  console.log('NewClaim event', claim_num, author_address, sender_address, recipient_address, txid, txts, amount, reward, stake, data, expiry_ts, event);
  const dispatch = store.dispatch;

  const claim_txid = event.transactionHash;
  const { transfers } = store.getState();
  const transfer = transfers.find(t => t.txid === txid);

  if (!transfer)
    return console.log(`claim of unrecognized transfer ${txid}`);

  if (author_address === recipient_address) {
    dispatch(updateTransferStatus({ txid, status: 'claim_confirmed', expiry_ts, claim_txid, claimant_address: author_address }));
    dispatch(claimMyself({ txid, claim_num: BigNumber.from(claim_num).toNumber() }));
  } else {
    dispatch(updateTransferStatus({ txid, status: 'claimed', claim_txid, claimant_address: author_address }));
    setTimeout(() => dispatch(updateTransferStatus({ txid, status: 'claim_confirmed', expiry_ts })), 1000);
  }
};

export const startWatchingContractForClaims = (dst_network, dst_bridge_aa) => {
  if (watchedContracts[dst_bridge_aa])
    return console.log(`already watching ${dst_bridge_aa}`);

  const contract = new ethers.Contract(dst_bridge_aa, counterstakeAbi, providers[dst_network]);
  contract.on('NewClaim', onNewClaim);
  watchedContracts[dst_bridge_aa] = true;
};
