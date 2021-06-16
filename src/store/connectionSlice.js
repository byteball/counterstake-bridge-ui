import { createSlice } from '@reduxjs/toolkit';

export const connectionSlice = createSlice({
  name: 'connection',
  initialState: {
    open: false
  },
  reducers: {
    openConnection: (state) => {
      state.open = true
    },
    closeConnection: (state) => {
      state.open = false
    },
  },
});

export const { openConnection, closeConnection} = connectionSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
export const selectConnectionStatus = state => state.connection.open;

export default connectionSlice.reducer;
