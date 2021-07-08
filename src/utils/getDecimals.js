import { ethers } from "ethers";

import { providers } from "services/evm";
import obyte from "services/socket";

export const getDecimals = async (tokenAddress, dst_network) => {
  try {
    if (dst_network === "Obyte") {

      if (tokenAddress === "base") return 9

      const descriptionHashVar = await obyte.api.getAaStateVars({ address: process.env.REACT_APP_TOKEN_REGISTRY, var_prefix: `current_desc_${tokenAddress}` });
      const descriptionHash = descriptionHashVar[`current_desc_${tokenAddress}`]
      const decimalsVar = descriptionHash && await obyte.api.getAaStateVars({ address: process.env.REACT_APP_TOKEN_REGISTRY, var_prefix: `decimals_${descriptionHash}` });

      return decimalsVar?.[`decimals_${descriptionHash}`] || 0
    } else {

      if (tokenAddress === ethers.constants.AddressZero) return 18;

      const token = new ethers.Contract(tokenAddress, ['function decimals(uint256) public view virtual returns (uint8)'], providers[dst_network]);
      return await token.decimals();
    }
  } catch (e) {
    console.log(`getDecimals(${tokenAddress}) failed`, e);
    return null;
  }
}
