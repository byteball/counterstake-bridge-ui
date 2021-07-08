import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ethers } from 'ethers';

export const getChain = createAsyncThunk(
  'get/chain',
  async () => {
    const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);

    if (!provider) return null;

    const metaMaskChainId = await provider.getNetwork();

    return metaMaskChainId?.chainId || null;
  }
)

export const chainSlice = createSlice({
  name: 'chain',
  initialState: null,
  reducers: {
    changeChain: (_, action) => {
      return action.payload
    }
  },
  extraReducers: {
    [getChain.fulfilled]: (_, action) => {
      return action.payload;
    },
  }
});

export const { changeChain } = chainSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectChainId = state => state.chain;

export default chainSlice.reducer;
