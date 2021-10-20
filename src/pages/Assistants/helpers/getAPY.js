import { BigNumber, FixedNumber } from "ethers";
import moment from "moment";

import { sqrt } from "./sqrt";

const fn1e4 = FixedNumber.from(1e4);

export const getAPY = ({ ts, stake_balance, stake_balance_in_work, stake_mf, stake_profit, image_balance, image_balance_in_work, image_profit, image_mf, shares_supply, side, network, first_claim_date, management_fee, success_fee }) => {
  if (!first_claim_date) return 0;

  const timestamp = Number(Date.now() / 1000).toFixed(0);
  const t = moment.unix(+timestamp).diff(moment.utc(first_claim_date), "seconds");
  const T = 31536000;
  const degree = T / t;

  if (network === "Obyte") {
    if (!Number(shares_supply)) return 0;
    if (side === "export") {
      if (stake_balance === 0) return 0

      const gross_balance = stake_balance + stake_balance_in_work;
      const scaled_mf = (timestamp - ts) / (360 * 24 * 3600) * management_fee;
      const delta_mf = gross_balance * scaled_mf;
      const mf = stake_mf + delta_mf;
      const sf = Math.max(Math.floor(stake_profit * success_fee), 0);
      const balance = gross_balance - mf - sf;

      const growPrice = balance / shares_supply;

      return ((growPrice ** degree) - 1) * 100;
    } else {
      if (stake_balance === 0 || image_balance === 0) return 0

      const gross_stake_balance = stake_balance + stake_balance_in_work;
      const gross_image_balance = image_balance + image_balance_in_work;

      const scaled_mf = (timestamp - ts) / (360 * 24 * 3600) * management_fee;

      const delta_stake_mf = gross_stake_balance * scaled_mf;
      const delta_image_mf = gross_image_balance * scaled_mf;

      const stakeNetBalance = gross_stake_balance - (stake_mf + delta_stake_mf) - Math.max(Math.floor(stake_profit * success_fee), 0);
      const imageNetBalance = gross_image_balance - (image_mf + delta_image_mf) - Math.max(Math.floor(image_profit * success_fee), 0);

      return (((Math.sqrt(stakeNetBalance * imageNetBalance) / shares_supply) ** degree) - 1) * 100;
    }
  } else {
    if (side === "export") {
      const bnStakeBalance = BigNumber.from(stake_balance);
      const bnSharesSupply = BigNumber.from(shares_supply);

      if (bnStakeBalance.isZero() || bnSharesSupply.isZero()) return 0;

      const bnGrossBalance = FixedNumber.from(stake_balance).addUnsafe(FixedNumber.from(stake_balance_in_work));

      const bnNewMf = FixedNumber.from(stake_mf).mulUnsafe(FixedNumber.from(management_fee * 1e4).divUnsafe(fn1e4)).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600));

      const bnNetBalance = bnGrossBalance.subUnsafe(bnNewMf).subUnsafe(FixedNumber.from(stake_profit).mulUnsafe(FixedNumber.from(success_fee * 1e4)).divUnsafe(fn1e4));

      const growPrice = FixedNumber.from(bnNetBalance).divUnsafe(FixedNumber.from(bnSharesSupply.toString())).toString();

      return ((Number(growPrice) ** degree) - 1) * 100
    } else {
      const bnStakeBalance = BigNumber.from(stake_balance);
      const bnImageBalance = BigNumber.from(image_balance);
      const bnSharesSupply = BigNumber.from(shares_supply);

      if (bnStakeBalance.isZero() || bnSharesSupply.isZero() || bnImageBalance.isZero()) return 0

      const bnStakeGrossBalance = FixedNumber.from(stake_balance).addUnsafe(FixedNumber.from(stake_balance_in_work));
      const bnImageGrossBalance = FixedNumber.from(image_balance).addUnsafe(FixedNumber.from(image_balance_in_work));

      const bnStakeNewMf = FixedNumber.from(stake_mf).addUnsafe(bnStakeGrossBalance.mulUnsafe(FixedNumber.from(management_fee * 1e4)).divUnsafe(fn1e4).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)));
      const bnImageNewMf = FixedNumber.from(image_mf).addUnsafe(bnImageGrossBalance.mulUnsafe(FixedNumber.from(management_fee * 1e4)).divUnsafe(fn1e4).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)));


      const bnStakeNetBalance = bnStakeGrossBalance.subUnsafe(bnStakeNewMf).subUnsafe(FixedNumber.from(stake_profit).isNegative ? FixedNumber.from("0") : FixedNumber.from(success_fee * 1e4).divUnsafe(fn1e4).mulUnsafe(FixedNumber(stake_profit))).toString();
      const bnImageNetBalance = bnImageGrossBalance.subUnsafe(bnImageNewMf).subUnsafe(FixedNumber.from(image_profit).isNegative ? FixedNumber.from("0") : FixedNumber.from(success_fee * 1e4).divUnsafe(fn1e4).mulUnsafe(FixedNumber(image_profit))).toString();

      const sqrtMul = sqrt(FixedNumber.from(bnStakeNetBalance).mulUnsafe(FixedNumber.from(bnImageNetBalance)).toString()).toString()
      const growPrice = FixedNumber.from(sqrtMul).divUnsafe(FixedNumber.from(bnSharesSupply.toString())).toString();

      return ((growPrice ** degree) - 1) * 100;
    }
  }
}