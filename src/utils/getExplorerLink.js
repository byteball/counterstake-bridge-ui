export const getExplorerLink = (network, txid) => {
  const env = process.env.REACT_APP_ENVIRONMENT;

  if (!(env === "testnet" || env === "mainnet")) return txid

  switch (network) {
    case 'Obyte':
      return env === "testnet" ? `https://testnetexplorer.obyte.org/#${txid}` : `https://explorer.obyte.org/#${txid}`;
    case 'Ethereum':
      return env === "testnet" ? `https://rinkeby.etherscan.io/tx/${txid}` : `https://etherscan.io/tx/${txid}`;
    case 'BSC':
      return env === "testnet" ? `https://testnet.bscscan.com/tx/${txid}` : `https://bscscan.com/tx/${txid}`;
    default: throw Error(`unknown network ${network}`);
  }
}