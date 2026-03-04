import { ethers } from "ethers";

import { providers } from "services/evm";
import obyte from "services/socket";
import config from "appConfig";

const cache = {};

export const getDecimals = async (tokenAddress, dst_network) => {
  const cacheKey = `${dst_network}_${tokenAddress}`;
  if (cacheKey in cache) return cache[cacheKey];

  try {
    let result;

    if (dst_network === "Obyte") {

      if (tokenAddress === "base") { cache[cacheKey] = 9; return 9; }

      const descriptionHashVar = await obyte.api.getAaStateVars({ address: config.TOKEN_REGISTRY, var_prefix: `current_desc_${tokenAddress}` });
      const descriptionHash = descriptionHashVar[`current_desc_${tokenAddress}`]
      const decimalsVar = descriptionHash && await obyte.api.getAaStateVars({ address: config.TOKEN_REGISTRY, var_prefix: `decimals_${descriptionHash}` });

      result = decimalsVar?.[`decimals_${descriptionHash}`] || 0;
    } else {

      if (tokenAddress === ethers.constants.AddressZero) { cache[cacheKey] = 18; return 18; }

      const token = new ethers.Contract(tokenAddress, ['function decimals() public view returns (uint8)'], providers[dst_network]);

      result = await token.decimals();
    }

    if (result != null) cache[cacheKey] = result;
    return result;
  } catch (e) {
    console.log(`getDecimals(${tokenAddress}) failed`, e);
    return null;
  }
}
