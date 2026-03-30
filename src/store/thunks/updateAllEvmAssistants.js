import { createAsyncThunk } from "@reduxjs/toolkit";
import { getExtendedAssistantData, promiseAllWithConcurrency } from "utils";
import { updateEvmAssistant } from "./updateEvmAssistant";

export const updateAllEvmAssistants = createAsyncThunk(
  'update/updateAllEvmAssistants',
  async (_, { getState, dispatch }) => {
    const { assistants: { assistants }, directions, destAddress } = getState();

    const bridges = Object.keys(assistants);
    const evmAssistantsInfoGetter = [];
    const failedAddresses = [];

    bridges.forEach(bridge => {
      assistants[bridge].forEach(a => {
        if (a.network !== "Obyte") {
          evmAssistantsInfoGetter.push(() =>
            getExtendedAssistantData({ assistant_aa: a.assistant_aa, network: a.network, side: a.side, shares_asset: a.shares_asset, bridge_aa: bridge }, directions, destAddress)
              .catch((e) => {
                console.log(`Failed to update assistant ${a.assistant_aa}:`, e?.message);
                failedAddresses.push(a.assistant_aa);
                return null;
              })
          );
        }
      })
    });

    const results = await promiseAllWithConcurrency(evmAssistantsInfoGetter, 10);

    if (failedAddresses.length > 0) {
      console.log(`Retrying ${failedAddresses.length} failed EVM assistants in 5s...`);
      setTimeout(() => {
        failedAddresses.forEach((aa) => dispatch(updateEvmAssistant(aa)));
      }, 5000);
    }

    return results;
  })