import { BackTop, Typography } from "antd";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";

import { selectConnectionStatus } from "store/connectionSlice";
import { selectDestAddress } from "store/destAddressSlice";
import { selectDirections } from "store/directionsSlice";
import { WhatIsAssistant } from "components/WhatIsAssistant/WhatIsAssistant";
import { loadAssistants } from "store/thunks/loadAssistants";
import { getBalanceOfObyteWallet } from "store/thunks/getBalanceOfObyteWallet";
import { AssistantList } from "./AssistantList";
import styles from "./AssistantsPage.module.css";
import { updateAllEvmAssistant } from "store/thunks/updateAllEvmAssistant";
import { selectAssistants } from "store/assistantsSlice";

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
    let intervalId;
    if (addresses.Obyte) {
      intervalId = setInterval(() => dispatch(getBalanceOfObyteWallet()), 1000 * 60 * 5)
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [addresses.Obyte]);

  useEffect(() => {
    let intervalId;
    if (inited && Object.keys(assistants).length > 0) {
      intervalId = setInterval(() => dispatch(updateAllEvmAssistant()), 1000 * 60 * 3)
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