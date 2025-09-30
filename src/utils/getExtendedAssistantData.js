import { isArray } from "lodash";
import { BigNumber, ethers } from "ethers";

import obyte from "services/socket";
import { providers } from "services/evm";
import { getMultiCallAddress } from "./getMulticallAddress";
import { exportAssistantAbi, importAssistantAbi, multicallAbi } from "abi";
import { getBalance } from "./getBalance";

import appConfig from "appConfig";

import { getAaBalances } from "./getAaBalances";
import { getDecimals } from "./getDecimals";
import { getSymbol } from "./getSymbol";

export const getExtendedAssistantData = async ({ assistant_aa, network, side, bridge_aa, shares_asset }, directions, destAddress = {}) => {
    if (directions[bridge_aa] === undefined) {
        return null;
        // throw new Error("Unknown direction" + bridge_aa);
    }

    const stake_asset = side === 'import' ? directions[bridge_aa]?.stake_asset : directions[bridge_aa]?.src_token.asset;

    const assistantData = {
        bridge_aa,
        assistant_aa,
        stake_asset,
        stake_asset_symbol: side === 'import' ? null : directions[bridge_aa]?.src_token?.symbol,
        stake_asset_decimals: side === 'import' ? null : directions[bridge_aa]?.src_token?.decimals,
        image_asset: side === 'import' ? directions[bridge_aa]?.src_token.asset : undefined,
        image_asset_symbol: side === 'import' ? directions[bridge_aa]?.src_token?.symbol : undefined,
        image_asset_decimals: side === 'import' ? directions[bridge_aa]?.src_token?.decimals : undefined,
        home_asset: directions[bridge_aa]?.home_asset,
        home_network: directions[bridge_aa]?.home_network,
        home_symbol: directions[bridge_aa]?.home_symbol,
    };

    const nodeRealEthereumProvider = appConfig.NODEREAL_PROJECT_ID ? new ethers.providers.JsonRpcProvider(`https://eth-mainnet.nodereal.io/v1/${appConfig.NODEREAL_PROJECT_ID}`) : null;

    if (network !== "Obyte") { // EVM assistants
        const multiCallContract = new ethers.Contract(getMultiCallAddress(network), multicallAbi, network === "Ethereum" ? nodeRealEthereumProvider || providers[network] : providers[network]);
        const contractInterface = new ethers.utils.Interface(side === "import" ? importAssistantAbi : exportAssistantAbi);

        const calls = [
            {
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("mf")
            },
            {
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("ts")
            },
            {
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("success_fee10000")
            },
            {
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("management_fee10000")
            },
            {
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("profit")
            },
            {
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("balance_in_work")
            },
            {
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("exponent")
            },
            {
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("totalSupply")
            },
        ];

        if (side === "import") {
            calls.push({
                target: assistant_aa,
                callData: contractInterface.encodeFunctionData("swap_fee10000") // only for import side
            })
        }

        const balanceGetters = [
            getBalance(assistant_aa, stake_asset, network),
            side === "import" ? getBalance(assistant_aa, assistantData.image_asset, network) : Promise.resolve("0"),
            destAddress?.[network] ? getBalance(destAddress?.[network], shares_asset, network) : Promise.resolve("0"),
        ];

        const stakeTokenInfoGetters = side === "import"
            ? [
                getSymbol(stake_asset, network).then(symbol => assistantData.stake_asset_symbol = symbol),
                getDecimals(stake_asset, network).then(decimals => assistantData.stake_asset_decimals = decimals)
            ] : [];

        const [resultOfBatchingCalls, stakeBalance, imageBalance, userBalanceOfShares] = await Promise.all([multiCallContract.aggregate(calls).then(({ returnData }) => returnData), ...balanceGetters, ...stakeTokenInfoGetters]);

        const decodedData = resultOfBatchingCalls.map((data, index) => {
            const functionFragment = contractInterface.getFunction(calls[index].callData.slice(0, 10));
            return contractInterface.decodeFunctionResult(functionFragment, data);
        });

        const transformedData = decodedData.map((value, index) => {
            if (index === 2 || index === 3 || (side === "import" && index === decodedData.length - 1)) return value[0] / 1e4; // success_fee10000, management_fee10000, swap_fee10000

            return isArray(value) && value.length >= 2 ? [BigNumber.from(value[0]).toString(), BigNumber.from(value[1]).toString()] : BigNumber.from(typeof value[0] !== "number" ? value[0] : String(value[0])).toString();
        });

        let mf, ts, success_fee, management_fee, profit, balance_in_work, exponent, shares_supply, swap_fee;

        if (side === "import") {
            [mf, ts, success_fee, management_fee, profit, balance_in_work, exponent, shares_supply, swap_fee] = transformedData;
        } else {
            [mf, ts, success_fee, management_fee, profit, balance_in_work, exponent, shares_supply] = transformedData;
        }

        assistantData.my_balance_of_shares = userBalanceOfShares;
        assistantData.shares_decimals = 18;
        assistantData.ts = ts;
        assistantData.stake_balance = stakeBalance;
        assistantData.image_balance = imageBalance;
        assistantData.success_fee = success_fee;
        assistantData.management_fee = management_fee;
        assistantData.shares_supply = shares_supply;
        assistantData.exponent = exponent;

        if (side === "import") {

            assistantData.stake_balance_in_work = balance_in_work[0];
            assistantData.image_balance_in_work = balance_in_work[1];
            assistantData.stake_mf = mf[0];
            assistantData.image_mf = mf[1];

            assistantData.stake_profit = profit[0];
            assistantData.image_profit = profit[1];

            assistantData.swap_fee = swap_fee;
        } else {
            assistantData.stake_mf = mf;
            assistantData.stake_balance_in_work = balance_in_work;
            assistantData.stake_profit = profit;
        }

        return assistantData;

    } else if (network === "Obyte") { // Obyte assistant

        const stakeTokenInfoGetters = side === "import" ? [
            getSymbol(stake_asset, network).then(symbol => assistantData.stake_asset_symbol = symbol),
            getDecimals(stake_asset, network).then(decimals => assistantData.stake_asset_decimals = decimals)
        ] : [];

        // cache
        const [
            aaBalance,
            aaStateVars,
            aaParams,
            shares_decimals
        ] = await Promise.all([
            getAaBalances(assistant_aa),
            obyte.api.getAaStateVars({ address: assistant_aa }),
            obyte.api.getDefinition(assistant_aa).then(definition => definition[1].params),
            getDecimals(shares_asset, "Obyte"),
            ...stakeTokenInfoGetters
        ]);

        assistantData.shares_decimals = shares_decimals;
        assistantData.cacheBalance = aaBalance;
        assistantData.cacheState = aaStateVars;
        assistantData.cacheParams = aaParams;

        assistantData.management_fee = aaStateVars?.management_fee || aaParams?.management_fee;
        assistantData.success_fee = aaStateVars?.success_fee || aaParams?.success_fee;

        assistantData.shares_supply = aaStateVars?.shares_supply || 0;
        assistantData.exponent = aaParams?.exponent || 1;

        assistantData.stake_balance = aaBalance?.[assistantData.stake_asset] ?? 0;
        assistantData.image_balance = aaBalance?.[assistantData.image_asset] ?? 0;

        if (side === "import") {
            assistantData.swap_fee = aaStateVars.swap_fee || aaParams.swap_fee || 0.003;
            // mf
            assistantData.stake_mf = aaStateVars.mf.stake;
            assistantData.image_mf = aaStateVars.mf.image;
            // ts
            assistantData.ts = aaStateVars.mf.ts;
            // sf
            assistantData.stake_sf = Math.max(Math.floor(aaStateVars.stake_profit * assistantData.success_fee), 0);
            assistantData.image_sf = Math.max(Math.floor(aaStateVars.image_profit * assistantData.success_fee), 0);

            // balances in work
            assistantData.stake_balance_in_work = aaStateVars.stake_balance_in_work ?? 0;
            assistantData.image_balance_in_work = aaStateVars.image_balance_in_work ?? 0;

            // profit
            assistantData.stake_profit = aaStateVars.stake_profit ?? 0;
            assistantData.image_profit = aaStateVars.image_profit ?? 0;

            assistantData.stake_share = aaParams.stake_share || 0.5;
            assistantData.image_share = 1 - assistantData.stake_share;
        } else {
            // mf
            assistantData.stake_mf = aaStateVars.mf;
            // ts
            assistantData.ts = aaStateVars.ts;
            // sf
            assistantData.stake_sf = Math.max(Math.floor(aaStateVars.profit * assistantData.success_fee), 0);
            // balance in work
            assistantData.stake_balance_in_work = aaStateVars.balance_in_work ?? 0;
            // profit
            assistantData.stake_profit = aaStateVars.profit;
        }

        return assistantData;
    }
}
