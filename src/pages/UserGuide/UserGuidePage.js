import React, { useEffect, useState } from "react";
import { Typography, Tabs } from "antd";
import { Helmet } from "react-helmet-async";
import { useHistory, useParams } from "react-router-dom";
import { Link } from "react-router-dom";

import styles from "./UserGuidePage.module.css";
import { ReactComponent as MetamaskLogo } from "pages/Main/metamask-fox.svg";

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
          style={{ fontSize: '16px' }}
        >
          <TabPane tab={<Link style={{ pointerEvents: 'none' }} to="/user-guide/ethereum-to-obyte">Ethereum to Obyte</Link>} key="ethereum-to-obyte">
            <Ethereum2ObyteGuide />
          </TabPane>
          <TabPane tab={<Link style={{ pointerEvents: 'none' }} to="/user-guide/obyte-to-ethereum">Obyte to Ethereum</Link>} key="obyte-to-ethereum">
            <Obyte2EthereumGuide />
          </TabPane>
        </Tabs>

      </div>
    </div>
  );
};


const Ethereum2ObyteGuide = () => {
  return <div className={styles.userGuideTab}>
    <Helmet title="Counterstake Bridge - User Guide: Ethereum to Obyte" />

    <Paragraph>The below guide shows how to transfer ETH from Ethereum to Obyte. You can easily apply the same steps to transfer any other token from Ethereum to Obyte and from any other EVM based network (such as Binance Smart Chain) to Obyte.</Paragraph>

    <Paragraph>1. Go to the main page of counterstake.org and select "ETH on Ethereum" on the left side and "ETH on Obyte" on the right side. Note the number of assistants that are active on this transfer. The more, the better, a greater number means that more assistants compete to help you with your transfer.</Paragraph>
    <img src="/guide/EthereumToObyte/select-coins.png" alt="" />

    <Paragraph>2. Type the amount of ETH you want to transfer. Note the amount on the right side that you will receive. It is less than the amount you send by the reward you pay to an assistant who picks your transfer and sends you the money soon after the transfer was sent. Thanks to the assistant, you'll receive your money almost immediately while the assistant will claim your transfer and receive its full amount in a few days. The assistant will also pay the network fees necessary to claim your transfer on the destination chain, and that's included in the reward. The fees are low on Obyte, that's why transferring <i>to</i> Obyte is relatively inexpensive.</Paragraph>
    <img src="/guide/EthereumToObyte/amount.png" alt="" />

    <Paragraph>3. Copy/paste your Obyte address where you want to receive ETH on Obyte. If you don't have your Obyte wallet yet, <a href="https://obyte.org/#download" target="_blank" rel="noopener">install it from obyte.org website</a>. Mobile wallets are recommended, they are lightweight, and it takes only a couple of minutes to get to a fully operational wallet.</Paragraph>
    <img src="/guide/EthereumToObyte/wallet.png" alt="" />

    <Paragraph>4. Click the Transfer button. MetaMask confirmation window will pop up. If you are transferring a token other than ETH, you might see two confirmation windows when you transfer it for the first time: one to approve the smart contract to spend your tokens, the other to actually initiate the transfer. Accept both.</Paragraph>
    <div className={styles.images}>
      <img src="/guide/EthereumToObyte/confirmation-1.png" alt="" />
      <img src="/guide/EthereumToObyte/confirmation-2.png" alt="" />
      <img src="/guide/EthereumToObyte/approve.png" alt="" />
    </div>

    <Paragraph>No further actions are required from your side. You should receive your ETH on Obyte in 20-30 minutes. Just leave this tab open and you can do something else in the meantime, e.g. <a href="https://obyte.org/platform" target="_blank" rel="noopener">learn what else Obyte has to offer</a>. The page will update automatically as the status of your transfer changes. Below are the stages it should go through. If you don't receive your transfer within 40 minutes, please let us know via <a href="https://discord.obyte.org" target="_blank" rel="noopener">discord</a>. This is new software, bugs are possible, and we'll be grateful for your help in discovering them.</Paragraph>

    <Paragraph>Wait for your Ethereum transaction to get mined. If you set a reasonable gas price, it should take a few minutes maximum.</Paragraph>
    <img src="/guide/EthereumToObyte/status-list.png" alt="" />

    <Paragraph>Wait for 10 minutes more for an assistant to claim your transaction. Assistants wait for this period before claiming your transaction to be sure that it won't be reverted as they risk losing money otherwise.</Paragraph>
    <img src="/guide/EthereumToObyte/claimed.png" alt="" />

    <Paragraph>Wait for the assistant's claim to be confirmed. Normally, it takes 10-20 minutes.</Paragraph>
    <img src="/guide/EthereumToObyte/claim_confirmed.png" alt="" />

    <Paragraph>As soon as the assistant's claim is accepted, your money should be in your wallet. The assistant will actually receive your transfer in a few days but you don't have to bother about this, you can already use your ETH on Obyte.</Paragraph>
    <div className={styles.images}>
      <img src="/guide/EthereumToObyte/result.png" alt="" />
    </div>
  </div>
}


const Obyte2EthereumGuide = () => {
  return <div className={styles.userGuideTab}>
    <Helmet title="Counterstake Bridge - User Guide: Obyte to Ethereum" />

    <Paragraph>The below guide shows how to transfer GBYTE from Obyte to Ethereum. You can easily apply the same steps to transfer any other token from Obyte to Ethereum.</Paragraph>

    <Paragraph>1. Go to the main page of counterstake.org and select "GBYTE on Obyte" on the left side and "GBYTE on Ethereum" on the right side. Note the number of assistants that are active on this transfer. The more, the better, a greater number means that more assistants compete to help you with your transfer.</Paragraph>
    <img src="/guide/ObyteToEthereum/select-coins.png" alt="" />

    <Paragraph>2. Type the amount of GBYTE you want to transfer. Note the amount on the right side that you will receive. It is less than the amount you send by the reward you pay to an assistant who picks your transfer and sends you the money soon after the transfer was sent. Thanks to the assistant, you'll receive your money almost immediately while the assistant will claim your transfer and receive its full amount in a few days. The assistant will also pay the network fees necessary to claim your transfer on the destination chain, and that's included in the reward. The fees are quite high on Ethereum, that's why transferring larger amounts would be less expensive percentage-wise.</Paragraph>
    <img src="/guide/ObyteToEthereum/amount.png" alt="" />

    <Paragraph>3. Click the <MetamaskLogo style={{ height: "1em", width: "1em", verticalAlign: "middle" }} /> (MetaMask icon) to fill in your Ethereum address where you will receive your GBYTE. If you don't have MetaMask installed, please <a href="https://metamask.io/download.html" target="_blank" rel="noopener">install</a>. While making the first transfer, a MetaMask window will appear and request an approval to connect this website to your wallet.</Paragraph>
    <img src="/guide/ObyteToEthereum/metamask.png" alt="" />

    <div className={styles.images}>
      <img src="/guide/EthereumToObyte/confirmation-1.png" alt="" />
      <img src="/guide/EthereumToObyte/confirmation-2.png" alt="" />
    </div>

    <Paragraph>4. Click the Transfer button. Your installed Obyte wallet will start automatically and show the transaction you are about to send. If you are using a mobile Obyte wallet but browsing on desktop, click the QR icon on the Transfer button instead and scan the QR code with your camera app. Review the transaction details in your Obyte wallet and click Send. For your convenience, MetaMask will also try to add the token when you transfer it for the first time. Agree to add the token.</Paragraph>

    <div className={styles.images}>
      <img src="/guide/ObyteToEthereum/addToken.png" alt="" />
      <img src="/guide/ObyteToEthereum/send.png" alt="" />
    </div>

    <Paragraph>No further actions are required from your side. You should receive your GBYTE on Ethereum in 10-20 minutes. Just leave this tab open and you can do something else in the meantime, e.g. <a href="https://madeonobyte.org" target="_blank" rel="noopener">check out other projects made on Obyte</a>. The page will update automatically as the status of your transfer changes. Below are the stages it should go through. If you don't receive your transfer within 30 minutes, please let us know via <a href="https://discord.obyte.org" target="_blank" rel="noopener">discord</a>. This is new software, bugs are possible, and we'll be grateful for your help in discovering them.</Paragraph>

    <Paragraph>Wait for your Obyte transaction to get confirmed. Normally, it should take 10-20 minutes.</Paragraph>
    <img src="/guide/ObyteToEthereum/confirmed.png" alt="" />

    <Paragraph>Wait for an assistant to pick and claim your transfer. Normally, this should happen within a few seconds after the transaction gets confirmed.</Paragraph>
    <img src="/guide/ObyteToEthereum/claim_confirmed.png" alt="" />

    <Paragraph>Wait for the assistant's Ethereum transaction to get mined, usually less than a minute. At this moment, your money should be in your wallet, check your balance in MetaMask. The assistant will actually receive your transfer in a few days but you don't have to bother about this, you can already use your GBYTE on Ethereum.</Paragraph>

    <div className={styles.images}>
      <img src="/guide/ObyteToEthereum/balance.png" alt="" />
    </div>

  </div>
}
