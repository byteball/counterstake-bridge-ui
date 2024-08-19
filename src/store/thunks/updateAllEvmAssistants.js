import { createAsyncThunk } from "@reduxjs/toolkit";
import { getExtendedAssistantData } from "utils";

export const updateAllEvmAssistants = createAsyncThunk(
  'update/updateAllEvmAssistants',
  async (_, { getState }) => {
    const { assistants: { assistants }, directions, destAddress } = getState();

    const bridges = Object.keys(assistants);
    const evmAssistantsInfoGetter = [];

    bridges.forEach(bridge => {
      assistants[bridge].forEach(a => {
        if (a.network !== "Obyte") {
          evmAssistantsInfoGetter.push(getExtendedAssistantData({ assistant_aa: a.assistant_aa, network: a.network, side: a.side, shares_asset: a.shares_asset, bridge_aa: bridge }, directions, destAddress));
        }
      })
    });

    return await Promise.all(evmAssistantsInfoGetter);
  })