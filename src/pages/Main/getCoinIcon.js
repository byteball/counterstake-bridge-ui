import { ReactComponent as ObyteNetwork } from "./img/networks/obyte.svg";
import { ReactComponent as BscNetwork } from "./img/networks/bsc.svg";
import { ReactComponent as EthNetwork } from "./img/networks/eth.svg";


import { ReactComponent as BNBCoin } from "./img/coins/bnb.svg";
import { ReactComponent as BUSDCoin } from "./img/coins/busd.svg";

import { ReactComponent as ETHCoin } from "./img/coins/eth.svg";
import { ReactComponent as GBYTECoin } from "./img/coins/gbyte.svg";

import { ReactComponent as OUSDCoin } from "./img/coins/ousd.svg";
import { ReactComponent as USDCCoin } from "./img/coins/usdc.svg";

export const getCoinIcon = (network, symbol) => {
  const networkName = String(network).toLowerCase();
  const symbolName = String(symbol).toLowerCase();
  let SymbolIcon;
  let NetworkIcon;

  if (symbolName.includes("bnb")) {
    SymbolIcon = BNBCoin
  } else if (symbolName.includes("busd")) {
    SymbolIcon = BUSDCoin
  } else if (symbolName.includes("eth")) {
    SymbolIcon = ETHCoin
  } else if (symbolName.includes("gbyte")) {
    SymbolIcon = GBYTECoin
  } else if (symbolName.includes("ousd")) {
    SymbolIcon = OUSDCoin
  } else if (symbolName.includes("usdc")) {
    SymbolIcon = USDCCoin
  }

  if (networkName === "obyte") {
    NetworkIcon = ObyteNetwork
  } else if (networkName === "bsc") {
    NetworkIcon = BscNetwork
  } else if (networkName === "ethereum") {
    NetworkIcon = EthNetwork
  }

  return <div style={{ position: "relative", height: 40, marginRight: 10 }}>
    <SymbolIcon width={40} height={40} />
    <NetworkIcon width="50%" height="50%" style={{ right: 0, bottom: 0, position: "absolute" }} />
  </div>
}