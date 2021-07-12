import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Router, Route } from "react-router-dom";
import { useSelector } from "react-redux";

import { changeChainId, getChainId } from "store/chainIdSlice";
import { getBridgesParams } from "store/thunks";
import { MainLayout } from "./components/MainLayout/MainLayout";
import { selectConnectionStatus } from "store/connectionSlice";
import historyInstance from "./historyInstance";
import {
  HowItWorksPage,
  UserGuidePage,
  CSTokenPage,
  FaqPage,
  MainPage,
} from "./pages";


const AppRouter = () => {
  const dispatch = useDispatch();
  dispatch(getBridgesParams());

  const isOpenConnection = useSelector(selectConnectionStatus);

  useEffect(()=>{
    dispatch(getChainId());
  }, [isOpenConnection]);
  
  useEffect(()=>{
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
        {/* <Route path="/governance" component={GovernancePage} /> */}
        <Route path="/" component={MainPage} exact />
      </MainLayout>
    </Router>
  );
};

export default AppRouter;
