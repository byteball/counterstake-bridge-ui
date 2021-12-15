import moment from "moment";

export const getAPY = ({ ts, stake_balance = 0, stake_balance_in_work = 0, stake_mf = 0, stake_profit = 0, image_balance = 0, image_balance_in_work = 0, image_profit = 0, image_mf = 0, shares_supply = 0, side, network, first_claim_date, management_fee, success_fee }) => {
  if (!first_claim_date) return 0;

  const timestamp = moment.utc().unix();
  const first_claim_date_in_unix = moment.utc(first_claim_date).unix();
  const t = timestamp - first_claim_date_in_unix;

  const T = 31536000;
  const degree = T / t;

  if (!Number(shares_supply)) return 0;
  if (side === "export") {
    if (stake_balance === 0) return 0

    const gross_balance = Number(stake_balance) + Number(stake_balance_in_work);
    const scaled_mf = (timestamp - Number(ts)) / (360 * 24 * 3600) * Number(management_fee);
    const delta_mf = Number(gross_balance) * Number(scaled_mf);
    const mf = Number(stake_mf) + Number(delta_mf);
    const sf = Math.max(Math.floor(Number(stake_profit) * Number(success_fee)), 0);
    const balance = gross_balance - mf - sf;

    const priceGrowth = balance / Number(shares_supply);

    return ((priceGrowth ** degree) - 1) * 100;
  } else {
    if (Number(stake_balance) === 0 || Number(image_balance) === 0) return 0

    const gross_stake_balance = Number(stake_balance) + Number(stake_balance_in_work);
    const gross_image_balance = Number(image_balance) + Number(image_balance_in_work);

    const scaled_mf = (timestamp - Number(ts)) / (360 * 24 * 3600) * Number(management_fee);

    const delta_stake_mf = gross_stake_balance * scaled_mf;
    const delta_image_mf = gross_image_balance * scaled_mf;

    const stakeNetBalance = gross_stake_balance - (Number(stake_mf) + delta_stake_mf) - Math.max(Math.floor(Number(stake_profit) * Number(success_fee)), 0);
    const imageNetBalance = gross_image_balance - (Number(image_mf) + delta_image_mf) - Math.max(Math.floor(Number(image_profit) * Number(success_fee)), 0);

    return ((((Math.sqrt(stakeNetBalance * imageNetBalance) / shares_supply) / (first_claim_date === "2021-12-08 13:58:40" ? 1.3250266839 : 1)) ** degree) - 1) * 100;
  }
}