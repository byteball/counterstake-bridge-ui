import obyte from "obyte";

import config from "appConfig";

export const getExplorerLink = (network, data, type) => {
  const environment = config.ENVIRONMENT;

  if (!(environment === "testnet" || environment === "mainnet")) return data

  let isObyteAddress = false;

  if (network === "Obyte" && (type === 'address' || obyte.utils.isValidAddress(data))) {
    isObyteAddress = true;
  }

  switch (network) {
    case 'Obyte':
      return environment === "testnet" ? `https://testnetexplorer.obyte.org/${isObyteAddress ? 'address/' : ''}${data}` : `https://explorer.obyte.org/${isObyteAddress ? 'address/' : ''}${data}`;
    case 'Ethereum':
      return environment === "testnet" ? `https://rinkeby.etherscan.io/${type || "tx"}/${data}` : `https://etherscan.io/${type || "tx"}/${data}`;
    case 'BSC':
      return environment === "testnet" ? `https://testnet.bscscan.com/${type || "tx"}/${data}` : `https://bscscan.com/${type || "tx"}/${data}`;
    case 'Polygon':
      return environment === "testnet" ? `https://mumbai.polygonscan.com/${type || "tx"}/${data}` : `https://polygonscan.com/${type || "tx"}/${data}`;
    default: return "#"
  }
}