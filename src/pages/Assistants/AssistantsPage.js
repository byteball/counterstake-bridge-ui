import { BackTop, Typography } from "antd";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";

import { selectConnectionStatus } from "store/connectionSlice";
import { selectDestAddress } from "store/destAddressSlice";
import { WhatIsAssistant } from "components/WhatIsAssistant/WhatIsAssistant";
import { AssistantList } from "./AssistantList";
import styles from "./AssistantsPage.module.css";
import { updateAllEvmAssistants } from "store/thunks/updateAllEvmAssistants";
import { selectAssistants, selectAssistantsLoadStatus } from "store/assistantsSlice";
import client from "services/socket";
import { loadAssistants } from "store/thunks/loadAssistants";
import { selectDirections } from "store/directionsSlice";

const { Title } = Typography;

const EVM_ASSISTANTS_UPDATE_INTERVAL = 1000 * 60 * 15;

export const AssistantsPage = () => {
  const [inited, setInited] = useState(false);
  const dispatch = useDispatch();
  const addresses = useSelector(selectDestAddress);
  const assistants = useSelector(selectAssistants);
  const isOpenConnection = useSelector(selectConnectionStatus);
  const assistantsWasLoaded = useSelector(selectAssistantsLoadStatus);
  const directions = useSelector(selectDirections);

  useEffect(() => {
    if (addresses?.Obyte && isOpenConnection){
      client.justsaying("light/new_address_to_watch", addresses?.Obyte)
    }
  }, [addresses.Obyte, isOpenConnection]);

  useEffect(() => {
    if (!assistantsWasLoaded && isOpenConnection && !inited && Object.keys(directions).length > 0) {
      setInited(true);
      dispatch(loadAssistants());
    }
  }, [assistantsWasLoaded, isOpenConnection, inited, directions]);

  useEffect(() => {
    let intervalId;
    if (Object.keys(assistants).length > 0) {
      intervalId = setInterval(() => dispatch(updateAllEvmAssistants()), EVM_ASSISTANTS_UPDATE_INTERVAL);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [assistants]);

  return (
    <div className={styles.assistants}>
      <Helmet title="Counterstake Bridge - Assistants" />
      <Title level={1} style={{ marginBottom: 10 }}>Pooled assistants</Title>
      <WhatIsAssistant />
      <AssistantList />
      <BackTop />
    </div>
  )
}