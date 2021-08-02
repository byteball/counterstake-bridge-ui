import { createSlice } from '@reduxjs/toolkit';
import { chainIds } from 'chainIds';

const environment = process.env.REACT_APP_ENVIRONMENT;

const initialState = {
  Obyte: null
};

Object.keys(chainIds[environment]).forEach((n) => initialState[n] = null);

export const destAddressSlice = createSlice({
  name: 'destAddress',
  initialState,
  reducers: {
    setDestAddress: (state, action) => {
      state[action.payload.network] = action.payload.address
    },
  },
});

export const { setDestAddress } = destAddressSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
export const selectDestAddress = state => state.destAddress;

export default destAddressSlice.reducer;
