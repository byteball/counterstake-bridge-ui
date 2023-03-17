import React from "react";
import { Menu } from "antd";
import { NavLink } from "react-router-dom";

import { useWindowSize } from "hooks/useWindowSize";

export const MainMenu = ({ mode, pathname, onClose }) => {

  const getPathnameForMenu = () => {
    return pathname.split("/").slice(0, 2).join("/");
  };

  const [width] = useWindowSize();

  const styles = mode === "horizontal" ? { width: mode === "horizontal" ? (width > 1090 ? width - 300 : width - 250) : "auto", display: "flex", justifyContent: "flex-end" } : {};

  return (
    <Menu
      mode={mode === "horizontal" ? "horizontal" : "vertical"}
      overflowedIndicator=". . ."
      style={{ border: "none", ...styles }}
      selectedKeys={pathname !== "/" ? [getPathnameForMenu()] : []}
      onOpenChange={() => {
        onClose && onClose();
      }}
    >
      <Menu.Item key="/how-it-works">
        <NavLink to="/how-it-works" onClick={onClose} activeClassName="selected" style={{ verticalAlign: "middle" }}>
          How it works
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/cs-token">
        <NavLink to="/cs-token" onClick={onClose} activeClassName="selected" style={{ verticalAlign: "middle" }}>
          CS Token
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/user-guide">
        <NavLink to="/user-guide" onClick={onClose} activeClassName="selected" style={{ verticalAlign: "middle" }}>
          User guide
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/developers">
        <NavLink to={{ pathname: "https://github.com/byteball/counterstake-sdk" }} target="_blank" rel="noopener" activeClassName="selected" style={{ verticalAlign: "middle" }}>
          Developers
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/governance">
        <NavLink onClick={onClose} to="/governance" activeClassName="selected" style={{ verticalAlign: "middle" }}>
          Governance
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/assistants">
        <NavLink onClick={onClose} to="/assistants" activeClassName="selected" style={{ verticalAlign: "middle" }}>
          Pooled assistants
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/create">
        <NavLink onClick={onClose} to="/create" activeClassName="selected" style={{ verticalAlign: "middle" }}>
          Create
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/faq">
        <NavLink onClick={onClose} to="/faq" activeClassName="selected" style={{ verticalAlign: "middle" }}>
          F.A.Q.
        </NavLink>
      </Menu.Item>
    </Menu>
  );
};
