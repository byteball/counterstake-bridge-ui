import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Router, Route } from "react-router-dom";
import { useSelector } from "react-redux";

import { changeChainId, getChainId } from "store/chainIdSlice";
import { getBridgesParams, updateBridges } from "store/thunks";
import { loadAssistants } from "store/thunks/loadAssistants";
import { MainLayout } from "./components/MainLayout/MainLayout";
import { selectConnectionStatus } from "store/connectionSlice";
import historyInstance from "./historyInstance";
import {
  HowItWorksPage,
  UserGuidePage,
  CSTokenPage,
  FaqPage,
  MainPage,
  GovernancePage,
  AssistantsPage,
  CreatePage
} from "./pages";


const AppRouter = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getBridgesParams());
    dispatch(loadAssistants());
  }, [])

  const isOpenConnection = useSelector(selectConnectionStatus);

  useEffect(() => {
    dispatch(getChainId());
  }, [isOpenConnection]);

  useEffect(() => {
    dispatch(updateBridges());

    const intervalId = setInterval(() => { dispatch(updateBridges()) }, 1000 * 60 * 5);

    return () => {
      clearInterval(intervalId)
    }

  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum?.on('chainChanged', (newChainId) => {
        dispatch(changeChainId(Number(newChainId)));
      });
    }
  }, []);

  return (
    <Router history={historyInstance}>
      <MainLayout>
        <Route path="/how-it-works" component={HowItWorksPage} />
        <Route path="/user-guide/:tab?" component={UserGuidePage} />
        <Route path="/cs-token" component={CSTokenPage} />
        <Route path="/faq" component={FaqPage} />
        <Route path="/governance/:address?" component={GovernancePage} />
        <Route path="/assistants" component={AssistantsPage} />
        <Route path="/create" component={CreatePage} />
        <Route path="/" component={MainPage} exact />
      </MainLayout>
    </Router>
  );
};

export default AppRouter;
