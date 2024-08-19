import { createSlice } from '@reduxjs/toolkit';

export const directionsSlice = createSlice({
  name: 'directions',
  initialState: {},
  reducers: {
    setDirections: (_state, action) => {
		  return action.payload;
    },
  },
});

export const { setDirections } = directionsSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
export const selectDirections = state => state.directions;

export default directionsSlice.reducer;
