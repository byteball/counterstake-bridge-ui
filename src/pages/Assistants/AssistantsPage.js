import { BackTop, Typography } from "antd";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";

import { selectConnectionStatus } from "store/connectionSlice";
import { selectDestAddress } from "store/destAddressSlice";
import { selectDirections } from "store/directionsSlice";
import { WhatIsAssistant } from "components/WhatIsAssistant/WhatIsAssistant";
import { loadAssistants } from "store/thunks/loadAssistants";
import { AssistantList } from "./AssistantList";
import styles from "./AssistantsPage.module.css";
import { updateAllEvmAssistants } from "store/thunks/updateAllEvmAssistants";
import { selectAssistants } from "store/assistantsSlice";
import client from "services/socket";

const { Title } = Typography;

export const AssistantsPage = () => {
  const dispatch = useDispatch();
  const directions = useSelector(selectDirections);
  const addresses = useSelector(selectDestAddress);
  const assistants = useSelector(selectAssistants);
  const isOpenConnection = useSelector(selectConnectionStatus);

  const [inited, setInited] = useState(false);

  useEffect(() => {
    if (Object.keys(directions).length > 0 && !inited) {
      dispatch(loadAssistants())
      setInited(true);
    }
  }, [directions]);

  useEffect(() => {
    setInited(false);
  }, [isOpenConnection])

  useEffect(() => {
    if (addresses?.Obyte && isOpenConnection){
      client.justsaying("light/new_address_to_watch", addresses?.Obyte)
    }
  }, [addresses.Obyte, isOpenConnection]);

  useEffect(() => {
    let intervalId;
    if (inited && Object.keys(assistants).length > 0) {
      intervalId = setInterval(() => dispatch(updateAllEvmAssistants()), 1000 * 60 * 3)
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [inited, assistants]);

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