import { createAsyncThunk } from "@reduxjs/toolkit";
import obyte from "services/socket";

export const getBalanceOfObyteWallet = createAsyncThunk(
  'getBalanceOfObyteWallet',
  async (_, { getState }) => {
    const store = getState();
    const { Obyte: obyteWalletAddress } = store.destAddress;
    if (obyteWalletAddress){
      return await obyte.api.getBalances([obyteWalletAddress]).then((b) => b?.[obyteWalletAddress]);
    }
  })