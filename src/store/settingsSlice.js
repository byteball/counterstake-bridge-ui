import { createSlice } from '@reduxjs/toolkit';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    assistants: {
      sortType: "bridge",
      filters: []
    },
    creationOrders: {
      assistant: null,
      bridge: null
    },
    importedTokens: {

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
      const { value, type } = action.payload;
      state.assistants.filters = state.assistants.filters.filter((f) => !(f.value === value && f.type === type));
    },
    addCreationOrder: (state, action) => {
      const { orderType, ...config } = action.payload;
      if (!state.creationOrders) {
        state.creationOrders = {}
      }
      if (orderType === "assistant") {
        state.creationOrders.assistant = { ...config, status: "pending" };
      } else if (orderType === "bridge") {
        state.creationOrders.bridge = { ...config, status: "pending" };
      }
    },
    removeCreationOrder: (state, action) => {
      const { orderType } = action.payload;

      if (orderType === "assistant") {
        state.creationOrders.assistant = null;
      } else if (orderType === "bridge") {
        state.creationOrders.bridge = null;
      }
    },
    configureBridge: (state, action) => {
      state.creationOrders.bridge = { ...state.creationOrders.bridge, ...action.payload };
      state.creationOrders.bridge.status = "configured";
    },
    updateBridgeOrder: (state, action) => {
      state.creationOrders.bridge = { ...state.creationOrders.bridge, ...action.payload}
    },
    updateAssistantOrderStatus: (state, action) => {
      const { status, txid, address, shares_asset } = action.payload;

      if (status === "sent") {
        state.creationOrders.assistant.txid = txid;
        state.creationOrders.assistant.status = status;
      } else if (status === "created") {
        state.creationOrders.assistant.address = address;
        state.creationOrders.assistant.shares_asset = shares_asset;
        state.creationOrders.assistant.status = status;
      }
    },
    registerSymbolForPooledAssistant: (state, action) => {
      state.creationOrders.assistant.shares_symbol = action.payload;
      state.creationOrders.assistant.status = "success";
    },
    updateImportedTokens: (state, action) => {
      state.importedTokens = action.payload;
    }
  }
});

export const {
  setAssistantsSort,
  addFilter,
  removeFilter,
  addCreationOrder,
  removeCreationOrder,
  updateAssistantOrderStatus,
  registerSymbolForPooledAssistant,
  configureBridge,
  updateBridgeOrder,
  updateImportedTokens
} = settingsSlice.actions;


// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

export default settingsSlice.reducer;

export const selectSortType = state => state.settings.assistants.sortType;
export const selectFilters = state => state.settings.assistants.filters;
export const selectAssistantCreationOrder = state => state.settings.creationOrders?.assistant || null;
export const selectBridgeCreationOrder = state => state.settings.creationOrders?.bridge || null;
export const selectImportedTokens = state => state.settings.importedTokens; 