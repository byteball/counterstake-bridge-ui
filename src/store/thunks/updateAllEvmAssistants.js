import { createAsyncThunk } from "@reduxjs/toolkit";
import { exportAssistantAbi, importAssistantAbi } from "abi";
import { BigNumber, ethers } from "ethers";
import { isArray } from "lodash";
import { providers } from "services/evm";
import { getBalance } from "utils/getBalance";

export const updateAllEvmAssistants = createAsyncThunk(
  'update/updateAllEvmAssistants',
  async (_, { getState }) => {
    const { assistants: { assistants }, destAddress } = getState();

    const bridges = Object.keys(assistants);
    const evmAssistants = [];

    bridges.forEach(bridge => {
      assistants[bridge].forEach(a => {
        if (a.network !== "Obyte") {
          evmAssistants.push({ ...a, bridge_aa: bridge })
        }
      })
    })

    const getEvmAssistantInfo = evmAssistants.map(({ assistant_aa, network, side, stake_asset, image_asset, shares_asset, bridge_aa }) => {
      const assistant_contract = new ethers.Contract(assistant_aa, side === "import" ? importAssistantAbi : exportAssistantAbi, providers[network]);

      return Promise.all([
        assistant_contract.mf().then(value => isArray(value) ? [BigNumber.from(value[0]).toString(), BigNumber.from(value[1]).toString()] : BigNumber.from(value).toString()),
        assistant_contract.ts().then(value => BigNumber.from(value).toString()),
        assistant_contract.profit().then(value => isArray(value) ? [BigNumber.from(value[0]).toString(), BigNumber.from(value[1]).toString()] : BigNumber.from(value).toString()),
        assistant_contract.balance_in_work().then(value => isArray(value) ? [BigNumber.from(value[0]).toString(), BigNumber.from(value[1]).toString()] : BigNumber.from(value).toString()),
        assistant_contract.totalSupply().then(value => BigNumber.from(value).toString()),
        getBalance(assistant_aa, stake_asset, network),
        side === "import" ? getBalance(assistant_aa, image_asset, network) : null,
        destAddress?.[network] ? getBalance(destAddress?.[network], shares_asset, network) : "0",
      ]).then(([mf, ts, profit, balance_in_work, shares_supply, stake_balance, image_balance, my_balance_of_shares]) => {
        const parseData = {
          ts,
          stake_balance,
          image_balance,
          shares_supply,
          assistant_aa,
          my_balance_of_shares,
          bridge_aa
        }

        if (side === "import") {
          parseData.stake_balance_in_work = balance_in_work[0];
          parseData.image_balance_in_work = balance_in_work[1];

          parseData.stake_mf = mf[0];
          parseData.image_mf = mf[1];

          parseData.stake_profit = profit[0];
          parseData.image_profit = profit[1];

        } else {
          parseData.stake_mf = mf;
          parseData.stake_balance_in_work = balance_in_work;
          parseData.stake_profit = profit;
        }

        return parseData;
      })
    })

    const updatedData = await Promise.all(getEvmAssistantInfo);

    return updatedData;
  })