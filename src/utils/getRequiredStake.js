import { ethers } from "ethers";
import { providers } from "services/evm";
import { executeGetter } from "./executeGetter";

export const getRequiredStake = (dst_bridge_aa, dst_network, amount) => {
  try {
    if (dst_network === "Obyte") {
      return executeGetter(dst_bridge_aa, 'get_required_stake', [amount]);
    } else {
      const contract = new ethers.Contract(dst_bridge_aa, ["function getRequiredStake(uint amount) public view virtual returns (uint)"], providers[dst_network]);
      return contract.getRequiredStake(amount);
    }
  } catch (e) {
    console.log(`getRequiredStake(${dst_bridge_aa},${dst_network}, ${amount}) failed`, e);
    return null;
  }

}