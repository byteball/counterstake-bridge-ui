import { BigNumber, ethers } from "ethers";
import { counterstakeAbi } from "abi";
import { providers } from "services/evm";
import { executeGetter } from "./executeGetter";

export const getChallengingPeriod = async (period_number, stake, dst_network, aa) => {
  try {
    if (dst_network === "Obyte") {
      const is_large = await executeGetter(aa, 'is_stake_large', [stake]);
      const challenging_period_in_seconds = await executeGetter(aa, 'get_challenging_period', [period_number, is_large]);
      
      return challenging_period_in_seconds / 3600;
    } else {
      const contract = new ethers.Contract(aa, counterstakeAbi, providers[dst_network]);
      const settings = await contract.settings();
      const is_large = (BigNumber.from(settings.large_threshold).gt(0) && BigNumber.from(stake).gte(settings.large_threshold));

      return await contract.getChallengingPeriod(BigNumber.from(0), is_large);
    }
  } catch (e) {
    console.log(`getChallengingPeriodInEVM(${period_number}, ${dst_network}, ${aa}) failed`, e);
  }
}