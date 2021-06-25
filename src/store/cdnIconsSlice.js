import { createSlice } from '@reduxjs/toolkit';
import { getCoinIcons } from './thunks';

export const cdnIconsSlice = createSlice({
  name: 'cdnIcons',
  initialState: {
    list: [],
    loaded: false
  },
  extraReducers: {
    [getCoinIcons.fulfilled]: (state, action) => {
      state.list = action.payload;
      state.loaded = true;
    },
  }
});

export const { setGovernanceState } = cdnIconsSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export default cdnIconsSlice.reducer;
