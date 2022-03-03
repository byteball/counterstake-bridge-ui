import { CheckCircleOutlined, LoadingOutlined, ToolOutlined } from "@ant-design/icons";

import { ReactComponent as BridgeIcon } from "./img/bridge.svg";
import { getNetworkIcon } from "./utils/getNetworkIcon";

export const BridgeView = ({ home_network, foreign_network, home_address, home_bridge_request, foreign_address, foreign_bridge_request }) => {
  const HomeIcon = getNetworkIcon(home_network);
  const ForeignNetwork = getNetworkIcon(foreign_network);

  let homeStatus;
  if (home_address) {
    homeStatus = "success";
  } else if (home_bridge_request) {
    homeStatus = "request";
  } else {
    homeStatus = "pending";
  }

  let foreignStatus;
  if (foreign_address) {
    foreignStatus = "success";
  } else if (foreign_bridge_request) {
    foreignStatus = "request";
  } else {
    foreignStatus = "pending";
  }

  const homeStatusStyles = { fontSize: 22, display: "block", margin: "0 7px" };
  const foreignStatusStyles = { fontSize: 22, display: "block", margin: "0 7px" };

  return <div style={{ margin: "0 auto", maxWidth: 320 }}>
    <BridgeIcon style={{ width: "calc(80% - 20px)", fill: "white", marginBottom: 20 }} />

    <div style={{ display: "flex", alignItems: "center" }}>
      <HomeIcon style={{ width: "40px" }} />
      <div style={{ borderBottom: "1px dashed #fff", height: 1, marginLeft: 7, width: 25 }}></div>
      {homeStatus === "success" ? <CheckCircleOutlined style={homeStatusStyles} /> : (homeStatus === "request" ? <LoadingOutlined style={foreignStatusStyles} /> : <ToolOutlined style={homeStatusStyles} />)}

      <div style={{ flex: 1, borderBottom: "1px dashed #fff", height: 1 }}></div>

      {foreignStatus === "success" ? <CheckCircleOutlined style={foreignStatusStyles} /> : (foreignStatus === "request" ? <LoadingOutlined style={foreignStatusStyles} /> : <ToolOutlined style={foreignStatusStyles} />)}
      <div style={{ borderBottom: "1px dashed #fff", height: 1, marginRight: 7, width: 25 }}></div>
      <ForeignNetwork style={{ width: "40px" }} />
    </div>
  </div>
}