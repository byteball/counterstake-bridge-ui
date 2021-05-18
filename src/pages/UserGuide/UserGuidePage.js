import React, { useEffect, useState } from "react";
import { Typography, Tabs } from "antd";
import { Helmet } from "react-helmet-async";
import { Link, useHistory, useParams } from "react-router-dom";
import ReactGA from "react-ga";

import styles from "./UserGuidePage.module.css";

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;


export const UserGuidePage = () => {

  const urlParams = useParams();
  const history = useHistory();
  const { tab } = urlParams;
  const [currentTab, setCurrentTab] = useState(tab || "ethereum-to-obyte");

  useEffect(() => {
    if (tab !== currentTab) {
      history.replace(`/user-guide/${currentTab || ""}`);
    }
  }, [currentTab]);


  return (
    <div>
      <Helmet title="Counterstake Bridge - User Guide" />
      <div className={styles.userGuide}>
        <Title level={1}>User Guide</Title>
        <Paragraph>Counterstake Bridge allows you to transfer coins between networks.</Paragraph>

        <Tabs
          activeKey={currentTab}
          onChange={(key) => setCurrentTab(key)}
          animated={false}
          style={{fontSize: '16px'}}
        >
          <TabPane tab="Ethereum to Obyte" key="ethereum-to-obyte">
            <Ethereum2ObyteGuide/>
          </TabPane>
          <TabPane tab="Obyte to Ethereum" key="obyte-to-ethereum">
            <Obyte2EthereumGuide/>
          </TabPane>
        </Tabs>

      </div>
    </div>
  );
};


const Ethereum2ObyteGuide = () => {
  return <div>
    <Helmet title="Counterstake Bridge - User Guide: Ethereum to Obyte" />

    <Paragraph>The below guide shows how to transfer ETH from Ethereum to Obyte. You can easily apply the same steps to transfer any other token from Ethereum to Obyte and from any other EVM based network (such as Binance Smart Chain) to Obyte.</Paragraph>
    
    <Paragraph>1. Go to the main page of counterstake.org and select "ETH on Ethereum" on the left side and "ETH on Obyte" on the right side. Note the number of assistants that are active on this transfer. The more, the better, greater number means that more assistants compete to help you with your transfer.</Paragraph>
    [screenshot]

    <Paragraph>2. Type the amount of ETH you want to transfer. Note the amount on the right side that you will receive. It is less than the amount you send by the reward you pay to an assistant who picks your transfer and sends you the money soon after the transfer was sent. Thanks to the assistant, you'll receive your money almost immediately while the assistant will claim your transfer and receive its full amount in a few days. The assistant will also pay the network fees necessary to claim your transfer on the destination chain, and that's included in the reward. The fees are low on Obyte, that's why transferring <i>to</i> Obyte is relatively inexpensive.</Paragraph>
    [screenshot]
    
    <Paragraph>3. Copy/paste your Obyte address where you want to receive ETH on Obyte. If you don't have your Obyte wallet yet, <a href="https://obyte.org/#download" target="_blank" rel="noopener">install it from obyte.org website</a>. Mobile wallets are recommended, they are lightweight, and it takes only a couple of minutes to get to a fully operational wallet.</Paragraph>
    [screenshot]

    <Paragraph>4. Click the Transfer button. Metamask confirmation window will pop up. If you are transferring a token other than ETH, you might see two confirmation windows when you transfer it for the first time: one to approve the smart contract to spend your tokens, the other to actually initiate the tranfser. Accept both.</Paragraph>
    [screenshot]

    <Paragraph>No further actions are required from your side. You should receive your ETH on Obyte in 20-30 minutes. Just leave this tab open and you can do something else in the meantime, e.g. <a href="https://obyte.org/platform" target="_blank" rel="noopener">learn what else Obyte has to offer</a>. The page will update automatically as the status of your transfer changes. Below are the stages it should go through. If you don't receive your transfer within 40 minutes, please let us know via <a href="https://discord.obyte.org" target="_blank" rel="noopener">discord</a>. This is new software, bugs are possible, and we'll be greateful for your help in discovering them.</Paragraph>

    <Paragraph>Wait for your Ethereum transaction to get mined. If you set a reasonable gas price, it should take a few minutes maximum.</Paragraph>
    [screenshot]

    <Paragraph>Wait for 10 minutes more for an assistant to claim your transaction. Assistants wait for this period before claiming your transaction to be sure that it won't be reverted as they risk losing money otherwise.</Paragraph>
    [screenshot]

    <Paragraph>Wait for the assistant's claim to be confirmed. Normally, it takes 10-20 minutes.</Paragraph>
    [screenshot]

    <Paragraph>As soon as the assistant's claim is accepted, your money should be in your wallet. The assistant will actually receive your transfer in a few days but you don't have to bother about this, you can already use your ETH on Obyte.</Paragraph>
    [screenshot]

  </div>
}


const Obyte2EthereumGuide = () => {
  return <div>
    <Helmet title="Counterstake Bridge - User Guide: Obyte to Ethereum" />

    <Paragraph>The below guide shows how to transfer GBYTE from Obyte to Ethereum. You can easily apply the same steps to transfer any other token from Obyte to Ethereum.</Paragraph>
    
    <Paragraph>1. Go to the main page of counterstake.org and select "GBYTE on Obyte" on the left side and "GBYTE on Ethereum" on the right side. Note the number of assistants that are active on this transfer. The more, the better, greater number means that more assistants compete to help you with your transfer.</Paragraph>
    [screenshot]

    <Paragraph>2. Type the amount of GBYTE you want to transfer. Note the amount on the right side that you will receive. It is less than the amount you send by the reward you pay to an assistant who picks your transfer and sends you the money soon after the transfer was sent. Thanks to the assistant, you'll receive your money almost immediately while the assistant will claim your transfer and receive its full amount in a few days. The assistant will also pay the network fees necessary to claim your transfer on the destination chain, and that's included in the reward. The fees are quite high on Ethereum, that's why transferring larger amounts would be less expensive percentage-wise.</Paragraph>
    [screenshot]
    
    <Paragraph>3. Click the MetaMask icon to fill in your Ethereum address where you will receive your GBYTE. If you don't have MetaMask installed, please <a href="https://metamask.io/download.html" target="_blank" rel="noopener">install</a>.</Paragraph>
    [screenshot]

    <Paragraph>4. Click the Transfer button. Your installed Obyte wallet will start automatically and show the transaction you are about to send. If you are using a mobile Obyte wallet but browsing on desktop, click the QR icon on the Transfer button instead and scan the QR code with your camera app. Review the transaction details in your Obyte wallet and click Send.</Paragraph>
    [screenshot]

    <Paragraph>No further actions are required from your side. You should receive your GBYTE on Ethereum in 10-20 minutes. Just leave this tab open and you can do something else in the meantime, e.g. <a href="https://madeonobyte.org" target="_blank" rel="noopener">check out other projects made on Obyte</a>. The page will update automatically as the status of your transfer changes. Below are the stages it should go through. If you don't receive your transfer within 30 minutes, please let us know via <a href="https://discord.obyte.org" target="_blank" rel="noopener">discord</a>. This is new software, bugs are possible, and we'll be greateful for your help in discovering them.</Paragraph>

    <Paragraph>Wait for your Obyte transaction to get confirmed. Normally, it should take 10-20 minutes.</Paragraph>
    [screenshot]

    <Paragraph>Wait for an assistant to pick and claim your transfer. Normally, this should happen within a few seconds after the transaction got confirmed.</Paragraph>
    [screenshot]

    <Paragraph>Wait for the assistant's Ethereum transaction to get mined, usually less than a minute. At this moment, your money should be in your wallet, check your balance in MetaMask. The assistant will actually receive your transfer in a few days but you don't have to bother about this, you can already use your GBYTE on Ethereum.</Paragraph>
    [screenshot]

  </div>
}
