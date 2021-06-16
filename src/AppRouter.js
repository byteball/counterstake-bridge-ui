import React from "react";
import { Router, Route } from "react-router-dom";
import historyInstance from "./historyInstance";
import {
  HowItWorksPage,
  UserGuidePage,
  FaqPage,
  MainPage,
  GovernancePage,
} from "./pages";

import { MainLayout } from "./components/MainLayout/MainLayout";

const AppRouter = () => {

  return (
    <Router history={historyInstance}>
      <MainLayout>
        <Route path="/how-it-works" component={HowItWorksPage} />
        <Route path="/user-guide/:tab?" component={UserGuidePage} />
        <Route path="/faq" component={FaqPage} />
        {/* <Route path="/governance" component={GovernancePage} /> */}
        <Route path="/" component={MainPage} exact />
      </MainLayout>
    </Router>
  );
};

export default AppRouter;
