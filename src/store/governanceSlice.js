import { createSlice } from '@reduxjs/toolkit';
import { getObyteGovernanceParams } from './thunks';

export const governanceSlice = createSlice({
  name: 'governance',
  initialState: {
    obyte: {
      params: {},
      loaded: false,
      loading: false
    }
  },
  reducers: {
    // setObyteGovernanceState: (state, action) => {
    //   // state[action.payload.network] = action.payload.address
    // },
  },
  extraReducers: {
    [getObyteGovernanceParams.fulfilled]: (_, action) => {
      return action.payload
    },
  }
});

export const { setGovernanceState } = governanceSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`
export const selectObyteGovernanceParams = state => state.governance.params;

export default governanceSlice.reducer;
