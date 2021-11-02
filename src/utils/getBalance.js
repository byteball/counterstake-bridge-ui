import { ERC20Abi } from "abi";
import { ethers, BigNumber } from "ethers";

import { providers } from "services/evm";
import obyte from "services/socket";

export const getBalance = async (address, asset, network) => {
  try {
    if (network === "Obyte") {
      return await obyte.api.getBalances([address]).then((b) => b?.[address]?.[asset]?.total) || 0;
    } else {
      if (asset === ethers.constants.AddressZero) {
        return await providers[network].getBalance(address).then(value => BigNumber.from(value).toString());
      } else {
        const token = new ethers.Contract(asset, ERC20Abi, providers[network]);
        return await token.balanceOf(address).then(value => BigNumber.from(value).toString());
      }
    }
  } catch (e) {
    console.log("getBalance error", e)
  }
}