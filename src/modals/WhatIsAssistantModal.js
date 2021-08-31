import { InfoCircleFilled, InfoOutlined } from "@ant-design/icons";
import { Modal, Button, Typography } from "antd";
import { useState } from "react";

import { ReactComponent as Process } from "../pages/HowItWorks/img/process.svg";

const { Paragraph } = Typography;

export const WhatIsAssistantModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Button type="link" style={{ padding: 0, height: "auto" }} onClick={() => setIsModalVisible(true)}>
       <InfoCircleFilled /> What is Assistant?
      </Button>
      <Modal
        visible={isModalVisible}
        title="What is assistant?"
        footer={null}
        bodyStyle={{ fontSize: 16 }}
        width={700}
        onCancel={() => setIsModalVisible(false)}>
        <Process style={{ marginBottom: 20 }} />
        <Paragraph>
          Assistants can accelerate the process for users by claiming the transfers for them and immediately paying the claimed coins to the user, less a reward to the assistant. The assistant will then wait for the challenging period to expire, defend the claim if necessary, and withdraw the claimed coins with profit. When sending a transfer, users indicate the reward they are prepared to pay to an assistant who picks their transfer. The reward should be large enough to cover the network fees on the destination chain and make a profit for the assistant that is adequate to the risk the assistant takes and the capital they lock in claims.
        </Paragraph>
        <Paragraph>
          Assistants can be either solo assistants or pooled ones that pool the capital from several investors and are operated by a manager who earns a management fee and a success fee from generated profits. Pooled assistants are more likely to process large transfers. Assistants usually double as watchdogs and can challenge fraudulent claims as well as help users accelerate their transfers.
        </Paragraph>
        <a type="link" href="https://blog.obyte.org/counterstake-a-truly-decentralized-cross-chain-bridge-2d4a575b3f4a" target="_blank" rel="noopener">Read more in our blog</a>
      </Modal>
    </>
  )
}