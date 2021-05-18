import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { setPeriods } from 'store/transfersSlice';
import { Layout, Drawer, Row, Button } from "antd";
import { NavLink, useLocation } from "react-router-dom";
import ReactGA from "react-ga";

import { useWindowSize } from "hooks/useWindowSize";
import styles from "./MainLayout.module.css";
import { MainMenu } from "../MainMenu/MainMenu";
import { SocialIcons } from "../SocialIcons/SocialIcons";
import historyInstance from "../../historyInstance";

const { Header, Content, Footer } = Layout;

export const MainLayout = ({ children }) => {
  const dispatch = useDispatch();

  const { pathname } = useLocation();
  const [width] = useWindowSize();
  const [activeMenu, setActiveMenu] = useState(false);
  let [counter, setCounter] = useState(0);


  useEffect(() => {
    setInterval(() => setCounter(counter + 1), 10 * 60 * 1000);
  }, []);

  useEffect(() => {
    const unlisten = historyInstance.listen((location, action) => {
      if (action === "PUSH" || action === "POP") {
        ReactGA.pageview(location.pathname);
      }
    });
    ReactGA.pageview(pathname);
    return () => {
      unlisten();
    };
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          paddingLeft: 20,
          paddingRight: 20,
          height: "100%"
        }}
      >
        <Row
          justify={width < 990 ? "space-between" : undefined}
          align="middle"
        >
          <NavLink to="/" className={styles.navLink}>
            <img className={styles.logo} src="/logo256.png" alt="Counterstake Bridge" />

            {width > 440 && <div style={{ paddingLeft: 10 }}>
              <span>Counterstake Bridge</span>
            </div>}
          </NavLink>

          {width >= 990 ? (
            <MainMenu pathname={pathname} width={width} mode="horizontal" />
          ) : (
              <div style={{ display: "flex", alignItems: "center" }}>
                <Drawer
                  title={
                    <span>
                      Counterstake Bridge
                  </span>
                  }
                  placement="left"
                  closable={true}
                  onClose={() => setActiveMenu(false)}
                  visible={activeMenu}
                  bodyStyle={{ padding: 0, overflowX: "hidden" }}
                >
                  <MainMenu
                    pathname={pathname}
                    onClose={() => setActiveMenu(false)}
                    mode="vertical"
                  />
                  <div style={{ paddingLeft: 7 }}><SocialIcons size="short" /></div>
                </Drawer>

                <div style={{ marginLeft: "auto", marginRight: 20 }}><Button onClick={() => setActiveMenu(true)}>Menu</Button></div>
              </div>
            )}


        </Row>
      </Header>

      <Content
        className={styles.content}
        style={
          pathname === "/" || width < 1240
            ? { padding: 0 }
            : { padding: "20px 20px" }
        }
      >
        {children !== undefined && children !== null && (
          <div style={{ background: "#fff", padding: 20 }}>
            {children}
          </div>
        )}
      </Content>
      <Footer>
        <SocialIcons centered />
      </Footer>
    </Layout>
  );
};

