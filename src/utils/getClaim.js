import { counterstakeAbi } from "abi";
import { BigNumber, ethers } from "ethers";

import { providers } from "services/evm";
import obyte from "services/socket";

export const getClaim = async (num, aa, dst_network, bFinished) => {
  try {
    if (dst_network === "Obyte") {
      if (bFinished !== undefined) {
        const prefix = bFinished ? 'f_' : 'o_';
        const claim = await obyte.api.getAaStateVars({ address: aa, var_prefix: prefix + num });
        return claim?.[prefix + num] || null;
      } else {
        const f_claim = await obyte.api.getAaStateVars({ address: aa, var_prefix: 'f_' + num });
        if (`f_${num}` in f_claim) {
          return f_claim?.[`f_${num}`] || null;
        } else {
          const o_claim = await obyte.api.getAaStateVars({ address: aa, var_prefix: 'o_' + num });
          if (`o_${num}` in o_claim) {
            return o_claim?.[`o_${num}`] || null;
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