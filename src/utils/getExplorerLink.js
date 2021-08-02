export const getExplorerLink = (network, data, type) => {
  const env = process.env.REACT_APP_ENVIRONMENT;

  if (!(env === "testnet" || env === "mainnet")) return data

  switch (network) {
    case 'Obyte':
      return env === "testnet" ? `https://testnetexplorer.obyte.org/#${data}` : `https://explorer.obyte.org/#${data}`;
    case 'Ethereum':
      return env === "testnet" ? `https://rinkeby.etherscan.io/${type || "tx"}/${data}` : `https://etherscan.io/${type || "tx"}/${data}`;
    case 'BSC':
      return env === "testnet" ? `https://testnet.bscscan.com/${type || "tx"}/${data}` : `https://bscscan.com/${type || "tx"}/${data}`;
    case 'Polygon':
      return env === "testnet" ? `https://mumbai.polygonscan.com/${type || "tx"}/${data}` : `https://polygonscan.com/${type || "tx"}/${data}`;
    default: return "#"
  }
}