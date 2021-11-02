import { createSlice } from '@reduxjs/toolkit';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    assistants: {
      sortType: "bridge",
      filters: []
    }
  },
  reducers: {
    setAssistantsSort: (state, action) => {
      state.assistants.sortType = action.payload;
    },
    addFilter: (state, action) => {
      state.assistants.filters.push(action.payload)
    },
    removeFilter: (state, action) => {
      const {value, type} = action.payload;
      state.assistants.filters = state.assistants.filters.filter((f) => !(f.value === value && f.type === type));
    },
  }
});

export const { setAssistantsSort, addFilter, removeFilter } = settingsSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export default settingsSlice.reducer;

export const selectSortType = state => state.settings.assistants.sortType;
export const selectFilters = state => state.settings.assistants.filters;