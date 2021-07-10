import { ethers } from "ethers";
import obyte from "../services/socket";
import { providers } from "services/evm";

export const getRequiredStake = (dst_bridge_aa, dst_network, amount) => {
  try {
    if (dst_network === "Obyte") {
      return new Promise(function (resolve, reject) {
        obyte.client.request('light/execute_getter', { address: dst_bridge_aa, getter: 'get_required_stake', args: [amount] }, (err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res?.result)
          }
        });
      })
    } else {
      const contract = new ethers.Contract(dst_bridge_aa, ["function getRequiredStake(uint amount) public view virtual returns (uint)"], providers[dst_network]);
      return contract.getRequiredStake(amount);
    }
  } catch (e) {
    console.log(`getRequiredStake(${dst_bridge_aa},${dst_network}, ${amount}) failed`, e);
    return null;
  }

}