import { BigNumber, ethers } from "ethers";

import { providers } from "services/evm";
import { counterstakeAbi } from "counterstakeAbi.js";

export const getChallengingPeriodEVM = async (period_number, stake, dst_network, aa) => {
  try {
    if (dst_network !== "Obyte") {

      const contract = new ethers.Contract(aa, counterstakeAbi, providers[dst_network]);
      const settings = await contract.settings();
      const is_large = (BigNumber.from(settings.large_threshold).gt(0) && BigNumber.from(stake).gte(settings.large_threshold));

      return await contract.getChallengingPeriod(BigNumber.from(0), is_large);
    }
  } catch (e) {
    console.log(`getChallengingPeriodInEVM(${period_number}, ${dst_network}, ${aa}) failed`, e);
  }
}