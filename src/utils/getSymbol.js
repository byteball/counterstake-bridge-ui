import { ethers } from "ethers";
import { providers } from "services/evm";
import obyte from "services/socket";
import config from "appConfig";

export const getSymbol = async (tokenAddress, dst_network) => {
  if (dst_network === "Obyte") {

    if (tokenAddress === "base") return "GBYTE"

    const aaStateVars = await obyte.api.getAaStateVars({ address: config.TOKEN_REGISTRY, var_prefix: `a2s_${tokenAddress}` });

    if (`a2s_${tokenAddress}` in aaStateVars) {
      return aaStateVars[`a2s_${tokenAddress}`];
    } else {
      return tokenAddress
    }

  } else {

    if (tokenAddress === ethers.constants.AddressZero) {
      if (dst_network === "Ethereum") {
        return "ETH";
      } else if (dst_network === "BSC") {
        return "BNB";
      } else if (dst_network === "Polygon") {
        return "MATIC";
      } else if (dst_network === "Kava") {
        return "KAVA";
      }
    }

    try {
      const token = new ethers.Contract(tokenAddress, ["function symbol() view returns (string)"], providers[dst_network]);
      return await token.symbol() || tokenAddress;
    } catch (e) {
      console.log(`getSymbol(${tokenAddress}) failed`, e);
      return null;
    }
  }

}