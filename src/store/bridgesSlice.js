import { createSlice } from '@reduxjs/toolkit';
import { getBridgesParams } from './thunks';

export const bridgesSlice = createSlice({
  name: 'bridges',
  initialState: {
    importParams: {},
    exportParams: {}
  },
  extraReducers: {
    [getBridgesParams.fulfilled]: (_, action) => {
      return action.payload
    }
  }
});

// export const {  } = bridgesSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
// export const selectConnectionStatus = state => state.connection.open;

export default bridgesSlice.reducer;
