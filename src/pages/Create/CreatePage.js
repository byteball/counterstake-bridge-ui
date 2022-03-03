import { Helmet } from 'react-helmet-async';
import { Typography } from "antd";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty } from 'lodash';

import { SwitchActions } from 'components/SwitchActions/SwitchActions';
import { CreateAssistantForm } from './components/forms/CreateAssistantForm';
import { CreateBridge } from './components/tabs/CreateBridge';
import { selectAssistantCreationOrder, selectBridgeCreationOrder } from 'store/settingsSlice';
import { CreateAssistant } from './components/tabs/CreateAssistant';
import { loadTokenRegistryState } from 'store/thunks/loadTokenRegistryState';
import { selectTokenRegistryState } from 'store/tokenRegistrySlice';

const { Title, Paragraph } = Typography;

const dataForSwitch = [
  { text: "Bridge", value: "bridge" },
  { text: "Pooled assistant", value: "assistant" },
]

export const CreatePage = () => {
  const assistantCreationOrder = useSelector(selectAssistantCreationOrder);
  const bridgeCreationOrder = useSelector(selectBridgeCreationOrder);
  const tokenRegistryState = useSelector(selectTokenRegistryState);
  const dispatch = useDispatch();


  useEffect(() => {
    if (isEmpty(tokenRegistryState)) {
      dispatch(loadTokenRegistryState());
    }
  }, []);

  const [action, setAction] = useState((!assistantCreationOrder && !bridgeCreationOrder) ? "bridge" : (bridgeCreationOrder ? "bridge" : "assistant"));

  return <div style={{ maxWidth: 990, margin: "0 auto" }}>
    <Helmet title="Counterstake Bridge - Create bridge" />
    <Title level={1} style={bridgeCreationOrder ? { marginBottom: 10 } : {}}>Create</Title>

    {!assistantCreationOrder && !bridgeCreationOrder && <>
      <Paragraph>On this page you can create a bridge or pooled assistant</Paragraph>
      <SwitchActions data={dataForSwitch} onChange={(value) => setAction(value)} value="bridge" />
    </>}

    {action === "assistant" && <>
      {!assistantCreationOrder ? <CreateAssistantForm /> : <CreateAssistant orderData={assistantCreationOrder} />}
    </>}

    {action === "bridge" && <CreateBridge />}

  </div>
}