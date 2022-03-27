import { createSlice } from '@reduxjs/toolkit';
import { loadTokenRegistryState } from './thunks/loadTokenRegistryState';

export const tokenRegistrySlice = createSlice({
  name: 'tokenRegistryState',
  initialState: {},
  extraReducers: {
    [loadTokenRegistryState.fulfilled]: (_, action) => {
      return action.payload;
    },
  }
});

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
export const selectTokenRegistryState = state => state.tokenRegistryState;

export default tokenRegistrySlice.reducer;
