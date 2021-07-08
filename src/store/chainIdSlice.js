import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ethers } from 'ethers';

export const getChainId = createAsyncThunk(
  'get/chainId',
  async () => {
    const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);

    if (!provider) return null;

    const metaMaskChainId = await provider.getNetwork();

    return metaMaskChainId?.chainId || null;
  }
)

export const chainIdSlice = createSlice({
  name: 'chainId',
  initialState: null,
  reducers: {
    changeChainId: (_, action) => {
      return action.payload
    }
  },
  extraReducers: {
    [getChainId.fulfilled]: (_, action) => {
      return action.payload;
    },
  }
});

export const { changeChainId } = chainIdSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectChainId = state => state.chainId;

export default chainIdSlice.reducer;
