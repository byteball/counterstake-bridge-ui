import { combineReducers, configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist';
import storage from "redux-persist/lib/storage";

import transfersReducer from './transfersSlice';
import destAddressReducer from './destAddressSlice';
import directionsReducer from './directionsSlice';
import connectionSlice from './connectionSlice';
import governanceSlice from './governanceSlice';
import cdnIconsSlice from './cdnIconsSlice';
import inputsSlice from './inputsSlice';
import addedTokensSlice from './addedTokensSlice';
import bridgeAAParamsSlice from './bridgeAAParamsSlice';
import chainIdSlice from './chainIdSlice';
import assistantsSlice from './assistantsSlice';
import settingsSlice from './settingsSlice';
import tokenRegistrySlice from './tokenRegistrySlice';

import config from "appConfig";

const rootReducer = combineReducers({
  transfers: transfersReducer,
  destAddress: destAddressReducer,
  directions: directionsReducer,
  connection: connectionSlice,
  governance: governanceSlice,
  cdnIcons: cdnIconsSlice,
  inputs: inputsSlice,
  addedTokens: addedTokensSlice,
  bridgeAAParams: bridgeAAParamsSlice,
  chainId: chainIdSlice,
  settings: settingsSlice,
  assistants: assistantsSlice,
  tokenRegistryState: tokenRegistrySlice
});

const persistConfig = {
  key: `root${config.ENVIRONMENT === "testnet" ? "-tn" : ""}`,
  version: 1,
  storage,
  whitelist: ['transfers', 'destAddress', 'addedTokens', 'settings'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

const getStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
  });

  const persistor = persistStore(store);

  return { store, persistor };
}

export default getStore;

export const getPersist = (state) => state._persist;