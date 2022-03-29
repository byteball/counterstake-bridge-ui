import React from 'react';
import ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import ReactGA from "react-ga";
import { PersistGate } from "redux-persist/integration/react";
import 'antd/dist/antd.dark.less';

import getStore from "./store";
import AppRouter from "./AppRouter";
import reportWebVitals from './reportWebVitals';
import config from "appConfig";

import './index.css';

if (config.GA_ID) {
  ReactGA.initialize(config.GA_ID);
}

export const { store, persistor } = getStore();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <PersistGate loading={null} persistor={persistor}>
          <AppRouter />
        </PersistGate>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
