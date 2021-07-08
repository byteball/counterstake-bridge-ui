import { BigNumber, ethers } from "ethers";

import { providers } from "services/evm";
import obyte from "services/socket";
import { counterstakeAbi } from "counterstakeAbi.js";

export const getClaim = async (num, aa, dst_network, bFinished) => {
  try {
    if (dst_network === "Obyte") {
      if (bFinished !== undefined) {
        const prefix = bFinished ? 'f_' : 'o_';
        const clime = await obyte.api.getAaStateVars({ address: aa, var_prefix: prefix + num });
        return clime?.[prefix + num] || null;
      } else {
        const f_clime = await obyte.api.getAaStateVars({ address: aa, var_prefix: 'f_' + num });
        if (`f_${num}` in f_clime) {
          return f_clime?.[`f_${num}`] || null;
        } else {
          const o_clime = await obyte.api.getAaStateVars({ address: aa, var_prefix: 'o_' + num });
          if (`o_${num}` in o_clime) {
            return o_clime?.[`o_${num}`] || null;
          } else {
            return null
          }
        }
      }
    } else {
      const contract = new ethers.Contract(aa, counterstakeAbi, providers[dst_network]);
      const num_bn = BigNumber.from(num);
      return await contract['getClaim(uint256)'](num_bn)
    }
  } catch (e) {
    console.log(`getClaim(${num}) failed`, e);
  }
}