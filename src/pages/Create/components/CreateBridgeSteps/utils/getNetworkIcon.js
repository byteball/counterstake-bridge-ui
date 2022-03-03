import { ReactComponent as ObyteNetwork } from "pages/Main/img/networks/obyte.svg";
import { ReactComponent as BscNetwork } from "pages/Main/img/networks/bsc.svg";
import { ReactComponent as EthNetwork } from "pages/Main/img/networks/eth.svg";
import { ReactComponent as PolygonNetwork } from "pages/Main/img/networks/polygon.svg";
import { ReactComponent as DefaultNetwork } from "pages/Main/img/networks/default.svg";

export const getNetworkIcon = (network) => {
  let NetworkIcon;
  const networkName = String(network).toLowerCase();

  if (networkName === "obyte") {
    NetworkIcon = ObyteNetwork;
  } else if (networkName === "bsc") {
    NetworkIcon = BscNetwork;
  } else if (networkName === "ethereum") {
    NetworkIcon = EthNetwork;
  } else if (networkName === "polygon") {
    NetworkIcon = PolygonNetwork;
  } else {
    NetworkIcon = DefaultNetwork;
  }

  return NetworkIcon;
}