import { Collapse, Typography } from "antd";
import { WhatIsAssistantModal } from "modals/WhatIsAssistantModal";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useDispatch } from "react-redux";

import { getAssistantsInfo } from "store/thunks/getAssistantsInfo";

import styles from "./AssistantsPage.module.css";

const { Title } = Typography;

export const AssistantsPage = () => {
  const dispatch = useDispatch();

  useEffect(()=>{
    dispatch(getAssistantsInfo())
  }, []);

  return (
    <div className={styles.assistants}>
      <Helmet title="Counterstake Bridge - Governance" />
      <Title level={1}>Assistants</Title>
      <WhatIsAssistantModal />
    </div>
  )
}