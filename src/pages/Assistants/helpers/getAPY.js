import { BigNumber, FixedNumber } from "ethers";
import moment from "moment";

import { sqrt } from "./sqrt";

export const getAPY = ({ stake_balance, image_balance, shares_supply, side, network, first_claim_date }) => {
  if (!first_claim_date) return 0;

  const t = moment().diff(moment(first_claim_date), "days") + 1;
  const currentYear = moment().year();
  const T = moment(`${currentYear + 1}-01-01`, "YYYY-MM-DD").diff(`${currentYear}-01-01`, "days");
  const degree = T / t;

  if (network === "Obyte") {
    if (!Number(shares_supply)) return 0;
    if (side === "export") {
      if (stake_balance === 0) return 0
      const growPrice = stake_balance / shares_supply - 1;
      return (Math.abs(growPrice) ** degree) * 100 * (growPrice > 0 ? 1 : -1);
    } else {
      if (stake_balance === 0 || image_balance === 0) return 0

      const growPrice = Math.sqrt(stake_balance * image_balance) / shares_supply - 1;
      return (Math.abs(growPrice) ** degree) * 100 * (growPrice > 0 ? 1 : -1);
    }
  } else {
    if (side === "export") {
      const bnStakeBalance = BigNumber.from(stake_balance);
      const bnSharesSupply = BigNumber.from(shares_supply);

      if (bnStakeBalance.isZero() || bnSharesSupply.isZero()) return 0;

      const growPrice = FixedNumber.from(stake_balance).divUnsafe(FixedNumber.from(bnSharesSupply.toString())).toString() - 1;

      return (Math.abs(growPrice) ** degree) * 100 * (growPrice > 0 ? 1 : -1);
    } else {
      const bnStakeBalance = BigNumber.from(stake_balance);
      const bnImageBalance = BigNumber.from(image_balance);
      const bnSharesSupply = BigNumber.from(shares_supply);

      if (bnStakeBalance.isZero() || bnSharesSupply.isZero() || bnImageBalance.isZero()) return 0

      const sqrtMul = sqrt(bnStakeBalance.mul(bnImageBalance).toString()).toString()
      const growPrice = FixedNumber.from(sqrtMul).divUnsafe(FixedNumber.from(bnSharesSupply.toString())).toString() - 1;

      const res = (Math.abs(growPrice) ** degree) * 100 * (growPrice > 0 ? 1 : -1);

      return res;
    }
  }
}