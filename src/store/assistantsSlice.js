import { createSlice } from '@reduxjs/toolkit';

export const assistantsSlice = createSlice({
  name: 'bridgeAAParams',
  initialState: {
    test: 1
  },
  extraReducers: {
  
  }
});

// export const {  } = bridgesSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
// export const selectConnectionStatus = state => state.connection.open;

export default assistantsSlice.reducer;
