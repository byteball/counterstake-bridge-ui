export const calcAssistantUsdBalance = ({ network, side, stake_token_usd_rate = 0, assistant_aa, home_token_usd_rate = 0, stake_balance, stake_balance_in_work, stake_asset_decimals, image_balance, image_balance_in_work, image_asset_decimals }) => {
    const stake_usd_rate = side === "export" ? home_token_usd_rate : stake_token_usd_rate;
    if(!stake_usd_rate) return 0;
    
    if (network === "Obyte") {
        if (side === "export") {
            return ((stake_balance + (stake_balance_in_work || 0)) / 10 ** stake_asset_decimals) * stake_usd_rate;
        } else {
            if (stake_usd_rate && home_token_usd_rate) {
                return ((stake_balance + (stake_balance_in_work || 0)) / 10 ** stake_asset_decimals) * stake_usd_rate + ((image_balance + (image_balance_in_work || 0)) / 10 ** image_asset_decimals) * home_token_usd_rate;
            }
        }
    } else {
        if (side === "export") {
            const grossBalanceInSmallestUnits = Number(stake_balance) + Number(stake_balance_in_work);
            const grossBalanceInFullUnits = grossBalanceInSmallestUnits / 10 ** stake_asset_decimals;
            return grossBalanceInFullUnits * stake_usd_rate;
        } else {
            const stakeGrossBalanceInSmallestUnits = Number(stake_balance) + Number(stake_balance_in_work);
            const stakeGrossBalanceInFullUnits = stakeGrossBalanceInSmallestUnits / 10 ** stake_asset_decimals;

            const imageGrossBalanceInSmallestUnits = Number(image_balance) + Number(image_balance_in_work);
            const imageGrossBalanceInFullUnits = imageGrossBalanceInSmallestUnits / 10 ** image_asset_decimals;

            return stakeGrossBalanceInFullUnits * stake_usd_rate + imageGrossBalanceInFullUnits * home_token_usd_rate;
        }
    }
}
