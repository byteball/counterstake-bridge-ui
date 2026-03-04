import { ethers } from "ethers";
import { providers } from "services/evm";
import obyte from "services/socket";
import config from "appConfig";

const cache = {};

export const getSymbol = async (tokenAddress, dst_network) => {
  const cacheKey = `${dst_network}_${tokenAddress}`;
  if (cacheKey in cache) return cache[cacheKey];

  let result;

  if (dst_network === "Obyte") {

    if (tokenAddress === "base") { cache[cacheKey] = "GBYTE"; return "GBYTE"; }

    const aaStateVars = await obyte.api.getAaStateVars({ address: config.TOKEN_REGISTRY, var_prefix: `a2s_${tokenAddress}` });

    if (`a2s_${tokenAddress}` in aaStateVars) {
      result = aaStateVars[`a2s_${tokenAddress}`];
    } else {
      result = tokenAddress;
    }

  } else {

    if (tokenAddress === ethers.constants.AddressZero) {
      if (dst_network === "Ethereum") result = "ETH";
      else if (dst_network === "BSC") result = "BNB";
      else if (dst_network === "Polygon") result = "MATIC";
      else if (dst_network === "Kava") result = "KAVA";

      if (result) { cache[cacheKey] = result; return result; }
    }

    try {
      const token = new ethers.Contract(tokenAddress, ["function symbol() view returns (string)"], providers[dst_network]);
      result = await token.symbol() || tokenAddress;
    } catch (e) {
      console.log(`getSymbol(${tokenAddress}) failed`, e);
      return null;
    }
  }

  if (result != null) cache[cacheKey] = result;
  return result;
}
