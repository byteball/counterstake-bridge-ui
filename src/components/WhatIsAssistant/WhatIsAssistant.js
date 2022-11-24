import { Typography } from "antd";
import { useRef, useState } from "react";
import useCollapsible from "react-hook-collapse";

const { Paragraph } = Typography;

export const WhatIsAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useCollapsible(ref, isOpen);

  return (
    <>
      <span style={{ marginBottom: 10, cursor: "pointer", borderBottom: "1px dashed #fff", fontSize: 16 }} onClick={() => setIsOpen((o) => !o)}>What is an Assistant?</span>
      <div ref={ref} style={{ overflow: 'hidden', transition: '0.4s', paddingTop: 5 }}>
        <Paragraph>
          Assistants accelerate the transfer process for users by claiming the transfers for them and immediately paying the claimed coins to the user. For their help, they earn a reward which is subtracted from the amount received by the user. For transfers sent from this website, the reward is currently set as 1% of the transferred amount, and the assistant usually receives the full transferred amount in 3 days.        </Paragraph>
        <Paragraph>
          Assistants can be either solo assistants or pooled ones that pool the capital from several investors and are operated by a manager who earns a management fee and a success fee from generated profits. Pooled assistants are more likely to process large transfers. Assistants usually double as watchdogs and can challenge fraudulent claims as well as help users accelerate their transfers.
        </Paragraph>
        <a type="link" href="https://blog.obyte.org/counterstake-a-truly-decentralized-cross-chain-bridge-2d4a575b3f4a" target="_blank" rel="noopener">Read more in our blog</a>
      </div>
    </>
  )
}