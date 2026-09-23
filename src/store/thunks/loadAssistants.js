import { createAsyncThunk } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { groupBy } from "lodash";

import { getPooledAssistants } from "services/api";
import obyte from "services/socket";

import { getExtendedAssistantData, getDirectionsByBridgesInfo, promiseAllWithConcurrency } from "utils";

import { getBalanceOfObyteWallet } from "./getBalanceOfObyteWallet";
import { updateEvmAssistant } from "./updateEvmAssistant";
import { filterBridgesByNetworks } from "utils/filterBridgesByNetworks";
import { filterAssistantsByNetwork } from "utils/filterAssistantsByNetwork";
import { filterAssistantsByVersionAndEnvironment } from "utils/filterAssistantsByVersionAndEnvironment";

export const loadAssistants = createAsyncThunk(
  'get/loadAssistants',
  async (_, { getState, dispatch }) => {
    const { destAddress } = getState();
    // assistants use their own directions from bridges_info: /bridges (the global directions) omits some bridges that still have assistants
    const { assistants: assistantsListRaw, bridges_info: bridgesInfoRaw } = await getPooledAssistants({ reqBridgesInfo: true }).then(({ data }) => data);
    const bridgesInfo = filterBridgesByNetworks(bridgesInfoRaw);
    const directions = getDirectionsByBridgesInfo(bridgesInfo);
    let assistantsList = filterAssistantsByNetwork(assistantsListRaw);

    // filter out assistants whose bridge was filtered out (e.g. unsupported network on the other side)
    assistantsList = assistantsList.filter(({ bridge_aa }) => bridge_aa in directions);

    const shares_symbols = [];
    assistantsList = filterAssistantsByVersionAndEnvironment(assistantsList);
    assistantsList?.forEach(({ shares_symbol }) => shares_symbol && shares_symbols.push(shares_symbol));
    const failedIndices = [];

    const dataGetters = assistantsList.map((a, index) => () =>
      getExtendedAssistantData(a, directions, destAddress ?? {})
        .then((data) => assistantsList[index] = { ...a, ...data })
        .catch((e) => {
          console.log(`Failed to load assistant ${a.assistant_aa}:`, e?.message);
          assistantsList[index] = { ...a };
          failedIndices.push(index);
        })
    );

    await promiseAllWithConcurrency(dataGetters, 10);

    if (failedIndices.length > 0) {
      const failedEvmAddresses = failedIndices
        .map((index) => assistantsList[index])
        .filter((a) => a.network !== "Obyte")
        .map((a) => a.assistant_aa);

      if (failedEvmAddresses.length > 0) {
        console.log(`Retrying ${failedEvmAddresses.length} failed EVM assistants in 5s...`);
        setTimeout(() => {
          failedEvmAddresses.forEach((aa) => dispatch(updateEvmAssistant(aa)));
        }, 5000);
      }
    }

    dispatch(getBalanceOfObyteWallet());

    const homeTokens = {
      [ethers.constants.AddressZero]: "EVM native token"
    };

    const managers = [];
    const obyteAssistants = [];

    assistantsList.forEach((a) => {
      if (!managers.includes(a.manager)) {
        managers.push(a.manager)
      }

      if (!(a.home_asset in homeTokens)) {
        homeTokens[a.home_asset] = `${a.home_symbol} from ${a.home_network}`;
      }

      if (a.network === "Obyte") {
        obyte.justsaying("light/new_aa_to_watch", { aa: a.assistant_aa });
        obyteAssistants.push(a.assistant_aa)
      }
    });

    const assistants = groupBy(assistantsList, "bridge_aa");

    return {
      assistants,
      directions,
      managers,
      homeTokens,
      obyteAssistants,
      shares_symbols
    }
  });
