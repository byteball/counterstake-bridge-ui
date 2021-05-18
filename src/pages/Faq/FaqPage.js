import React from "react";
import { Collapse, Typography } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet-async";

import styles from "./FaqPage.module.css";

const { Panel } = Collapse;
const { Title } = Typography;

export const FaqPage = () => {
  return (
    <div className="faq">
      <Helmet title="Counterstake Bridge - F.A.Q." />
      <Title level={1}>F.A.Q.</Title>
      <Collapse
        accordion
        expandIconPosition="right"
        bordered={false}
        className={styles.collapse}
        expandIcon={({ isActive }) => (
          <DownOutlined rotate={isActive ? 180 : 0} className={styles.icon} />
        )}
      >
        <Panel
          header="How long does a cross-chain transfer take?"
          key="0"
          className={styles.panel}
        >
          <p>
            Usually under 30 minutes.
          </p>
        </Panel>

        <Panel
          header="How much does a transfer cost?"
          key="1"
          className={styles.panel}
        >
          <p>
            It depends on the direction of the transfer as the network fees on the destination network are one of the main factors that determines the cost. On Obyte, the fees are fractions of a cent while on Ethereum the total fees required to receive a transfer are $120 (assuming 100 gwei gas price and 1 ETH = $3,000). These fees don't depend on the size of the transfer, that's why larger transfers are less expensive percentage-wise. On top of that, you need to pay a reward to an assistant who helps you to receive your transfer. This website sets the reward to 1% but it may go down in the future thanks to competition among assistants.
          </p>
        </Panel>

        <Panel
          header="Who are assistants?"
          key="2"
          className={styles.panel}
        >
          <p>
            They are bots that help you receive your transfer on the destination network. They monitor both the source and destination networks 24/7 and claim your transfer for you. When claiming, an assistant who picked your transfer also pays the transfer amount to you, less the reward. Claiming requires that they lock their money both to pay to you and to put a stake that they risk to lose if the claim proves to be mistaken or fraudulent. If all goes well, they get back both the stake and the full transfer amount several days later. They risk their capital and lock it for some time, and for that, they expect a reward. 
          </p>
          <p>
            There can be many assistants monitoring the same transfer direction and they compete to be the first to pick your transfer and earn the reward, if the reward justifies the risk and time value of money.
          </p>
        </Panel>

        <Panel
          header="Can an assistant steal my money?"
          key="3"
          className={styles.panel}
        >
          <p>
            No, they can't. The code allows them to claim your transfer only if they simultaneously pay the transfer amount less the reward to you.
          </p>
        </Panel>

        <Panel
          header="Can I send a cross-chain transfer without paying an assistant reward?"
          key="4"
          className={styles.panel}
        >
          <p>
            Technically, you can. However, you'll need to claim the transfer yourself, pay a stake when claiming, monitor and defend your claim if it is challenged, and you'll be able to withdraw your transfer on the destination chain only several days later.
          </p>
          <p>
            That would be too complex for most users and this website offers the UI only for assistant-facilitated transfers.
          </p>
        </Panel>

        <Panel
          header="Can a whale block my transfer by staking large amounts against it?"
          key="4.5"
          className={styles.panel}
        >
          <p>
            They can try but if your claim is legitimate, it will be easy to mobilize the honest community to defend your claim and earn a portion of the whale's stake. In each consecutive counterstaking period, the total stake can grow only by a factor of 1.5 and each subsequent period is longer than the previous one. This gives enough time to mobilize the community around the true outcome.
          </p>
          <p>
            This assumes that the evil whale doesn't hold over 40% of the total supply of the coins being staked, which would be dangerous in many other respects if it were the case.
          </p>
        </Panel>

        <Panel
          header="What chains are supported?"
          key="5"
          className={styles.panel}
        >
          <p>
            Counterstake protocol can connect any two chains that support some form of on-chain <i>programmable agents</i>: Autonomous Agents on Obyte, Smart Contracts on Ethereum, Chaincode on Hyperledger Fabric, etc. It is currently implemented for Obyte, Ethereum, and Binance Smart Chain.
          </p>
        </Panel>

        <Panel
          header="Is counterstake protocol decentralized?"
          key="6"
          className={styles.panel}
        >
          <p>
            Yes, by design. Some other cross-chain bridge protocols rely on central custodians, operators, storemen, multisig signers, MPC signers, federated signers, etc. There is nothing like that in counterstake. Participation is open, anybody can become an assistant or even claim their transfers themselves without the help of assistants.
          </p>
        </Panel>

        <Panel
          header="Do I need to route every transfer through Obyte?"
          key="7"
          className={styles.panel}
        >
          <p>
            No, you don't have to. You can transfer directly between any two supported chains, e.g. between Ethereum and BSC.
          </p>
        </Panel>

        <Panel
          header="Do I need to use Counterstake token?"
          key="8"
          className={styles.panel}
        >
          <p>
            No, the protocol does not require any new tokens. However note that by using the protocol you are making CS holders richer. You might consider becoming one as well.
          </p>
        </Panel>

      </Collapse>
      <div className={styles.action}>
        Any other questions? Ask on <a href="https://discord.obyte.org/" target="_blank" rel="noopener">Discord</a>.
      </div>
    </div>
  );
};
