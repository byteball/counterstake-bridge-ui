import { Helmet } from "react-helmet-async"
import { Select, Typography } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { ObyteGovernance } from "./components/ObyteGovernance";

const { Title, Paragraph } = Typography;
const { Option, OptGroup } = Select;

const list = [
  {
    network_name: "obyte",
    import_name: "ETH on Obyte (import)",
    export_name: "GBYTE on Obyte (export)",
  }
]

const [obyte] = list;

export const GovernancePage = () => {
  const [agent, setAgent] = useState();
  // const dispatch = useDispatch();

  useEffect(() => {
    // manager
  }, [agent]);

  return <div>
    <Helmet title="Counterstake Bridge - Governance" />
    <Title level={1}>Governance</Title>
    <Paragraph>
      Section description Section description Section description Section description
    </Paragraph>
    <Select value={agent} onChange={(a) => setAgent(a)} style={{ width: "100%", maxWidth: 700 }} size="large" placeholder="Please select an agent">
      <OptGroup label={`${obyte.network_name} network`.toUpperCase()}>
        <Option value={`${obyte.network_name}_import`}>{obyte.import_name}</Option>
        <Option value={`${obyte.network_name}_export`}>{obyte.export_name}</Option>
      </OptGroup>
    </Select>
    {agent && <div>
      {String(agent).includes("obyte") && <ObyteGovernance />}
    </div>}
  </div>
}