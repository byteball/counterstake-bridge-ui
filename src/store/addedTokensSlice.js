import { createSlice } from '@reduxjs/toolkit';

export const addedTokensSlice = createSlice({
  name: 'addedTokens',
  initialState: {},
  reducers: {
    addTokenToTracked: (state, action) => {
      const { address, symbol, chainId } = action.payload;

      if (address in state) {
        if ((chainId in state[address]) && !(state[address][chainId].includes(symbol))){
          state[address][chainId].push(symbol)
        } else {
          state[address][chainId] = [symbol]
        }
      } else {
        state[address] = { [chainId]: [symbol] }
      }
    }
  },
});

export const { addTokenToTracked } = addedTokensSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export const selectAddedTokens = state => state.addedTokens;

export default addedTokensSlice.reducer;
