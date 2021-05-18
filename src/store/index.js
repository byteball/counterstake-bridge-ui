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

const rootReducer = combineReducers({
  transfers: transfersReducer,
  destAddress: destAddressReducer,
  directions: directionsReducer,
});

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['transfers'],
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

/*
export default configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
  },
});*/
