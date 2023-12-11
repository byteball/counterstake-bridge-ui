import { BigNumber, ethers } from "ethers";

import { claimMyself, updateTransferStatus } from "store/transfersSlice";
import { store } from "index";
import config from "appConfig";

const counterstakeAbi = [
  "event NewClaim(uint indexed claim_num, address author_address, string sender_address, address recipient_address, string txid, uint32 txts, uint amount, int reward, uint stake, string data, uint32 expiry_ts)"
];

const environment = config.ENVIRONMENT;

export const providers = {
  Ethereum: (environment === 'devnet')
    ? new ethers.providers.JsonRpcProvider("http://0.0.0.0:7545") // ganache
    : new ethers.providers.InfuraProvider(environment === 'testnet' ? "rinkeby" : "homestead", config.INFURA_PROJECT_ID),
  BSC: (environment === 'devnet')
    ? null
    : new ethers.providers.JsonRpcProvider(environment === 'testnet' ? "https://bsc-testnet.publicnode.com" : "https://bsc-dataseed.binance.org"),
  Polygon: (environment === 'devnet')
    ? null
    : new ethers.providers.JsonRpcProvider(environment === 'testnet' ? "https://rpc-mumbai.maticvigil.com" : "https://rpc-mainnet.maticvigil.com"),
  Kava: (environment === 'devnet')
    ? null
    : new ethers.providers.JsonRpcProvider(environment === 'testnet' ? "https://evm.testnet.kava.io" : "https://evm.kava.io"),
};

// new claim on Ethereum or BSC
const onNewClaim = (claim_num, author_address, sender_address, recipient_address, txid, txts, amount, reward, stake, data, expiry_ts, event) => {
  console.log('NewClaim event', claim_num, author_address, sender_address, recipient_address, txid, txts, amount, reward, stake, data, expiry_ts, event);
  const dispatch = store.dispatch;

  const claim_txid = event.transactionHash;
  const state = store.getState();
  const transfers = state.transfers;
  // const bridge_aa = event.address;
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

// to avoid duplicate event handlers, track the contracts that we are already watching for claims
let watchedContracts = {};

export const startWatchingContractForClaims = (dst_network, dst_bridge_aa) => {
  if (watchedContracts[dst_bridge_aa])
    return console.log(`already watching ${dst_bridge_aa}`);
  // we use our own providers, not the ones provided by metamask as they can change when the user switches networks
  const contract = new ethers.Contract(dst_bridge_aa, counterstakeAbi, providers[dst_network]);
  contract.on('NewClaim', onNewClaim);
  watchedContracts[dst_bridge_aa] = true;
}