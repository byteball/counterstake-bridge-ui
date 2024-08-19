import { createAsyncThunk } from "@reduxjs/toolkit";

import { getExtendedAssistantData } from "utils";

export const updateEvmAssistant = createAsyncThunk(
  'update/updateEVMAssistant',
  async (assistant_aa, { getState }) => {
    const { assistants: { assistants }, destAddress, directions } = getState();

    const bridges = Object.keys(assistants);
    const assistantsBridge = bridges.find((b) => assistants[b]?.findIndex((a) => a.assistant_aa === assistant_aa) >= 0);
    if (!assistantsBridge) throw new Error("No bridge for assistant", assistant_aa);

    const oldAssistantData = assistants[assistantsBridge]?.find((a) => a.assistant_aa === assistant_aa);

    const { network, side, stake_asset, image_asset, shares_asset, bridge_aa } = oldAssistantData;

    if (network !== "Obyte") {
      return await getExtendedAssistantData({ assistant_aa, network, side, stake_asset, image_asset, shares_asset, bridge_aa }, directions, destAddress);
    } else {
      throw new Error("This is Obyte network! This thunk doesn't support this network");
    }
  })