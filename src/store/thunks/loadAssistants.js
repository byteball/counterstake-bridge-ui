import { createAsyncThunk } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { groupBy } from "lodash";

import { getPooledAssistants } from "services/api";
import obyte from "services/socket";

import { getExtendedAssistantData, getDirectionsByBridgesInfo } from "utils";
import { setDirections } from "store/directionsSlice";

import appConfig from "appConfig";
import { getBalanceOfObyteWallet } from "./getBalanceOfObyteWallet";
import { nativeSymbols } from "nativeSymbols";

export const loadAssistants = createAsyncThunk(
  'get/loadAssistants',
  async (_, { getState, dispatch }) => {
    const { directions: directionsFromStore, destAddress } = getState();
    const reqBridgesInfo = Object.keys(directionsFromStore).length === 0;
    let { assistants: assistantsListRaw, bridges_info: bridgesInfoRaw } = await getPooledAssistants({ reqBridgesInfo }).then(({ data }) => data);
    const bridgesInfo = bridgesInfoRaw ? bridgesInfoRaw.filter(({foreign_network, home_network}) => ((foreign_network in nativeSymbols) || foreign_network === "Obyte") && (home_network === "Obyte" || (home_network in nativeSymbols))) : [];
    const directions = reqBridgesInfo ? getDirectionsByBridgesInfo(bridgesInfo) : directionsFromStore;
    let assistantsList = assistantsListRaw.filter(({ network }) => (network in nativeSymbols));

    if (reqBridgesInfo) {
      dispatch(setDirections(directions));
    }

    const shares_symbols = [];
    assistantsList = assistantsList.filter(({ network, version }) => (network === "Obyte" || version !== "v1") && (appConfig.ENVIRONMENT !== 'testnet' || network !== "Ethereum"));
    assistantsList?.forEach(({ shares_symbol }) => shares_symbol && shares_symbols.push(shares_symbol));
    const dataGetters = assistantsList.map((a, index) => getExtendedAssistantData(a, directions, destAddress ?? {}).then((data) => assistantsList[index] = { ...a, ...data }));

    await Promise.all(dataGetters);

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
      managers,
      homeTokens,
      obyteAssistants,
      shares_symbols
    }
  });
