import React, { useState, useEffect } from "react";
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

  const { pathname } = useLocation();
  const [width] = useWindowSize();
  const [activeMenu, setActiveMenu] = useState(false);

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
          background: "#141414",
          paddingLeft: 20,
          paddingRight: 20,
          height: "100%",
          color: "#fff"
        }}
      >
        <Row
          justify={width < 990 ? "space-between" : undefined}
          align="middle"
        >
          <NavLink to="/" className={styles.navLink}>
            <img className={styles.logo} src="/logo.svg" alt="Counterstake Bridge" />

            {width > 440 && <div style={{ paddingLeft: 10 }}>
              <span style={{ color: "#fff" }}>Counterstake Bridge</span>
            </div>}
          </NavLink>
          <div style={width > 990 ? { display: "flex", flex: 1, justifyContent: "flex-end" } : { display: "block" }}>

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
          </div>

        </Row>
      </Header>

      <Content
        className={styles.content}
        style={
          pathname === "/" || width < 1240
            ? { padding: 0 }
            : { paddingTop: 20 }
        }
      >
        {children !== undefined && children !== null && (
          <div style={{ background: "#141414", padding: 20 }}>
            {children}
          </div>
        )}
      </Content>
      <Footer style={{ backgroundColor: "#141414" }}>
        <SocialIcons centered />
      </Footer>
    </Layout>
  );
};

