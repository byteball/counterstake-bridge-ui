import { Link } from "react-router-dom";
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
      <div className={styles.titleWrap}>
        <Title level={1}>F.A.Q.</Title>
      </div>
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
            It depends on the direction of the transfer as the network fees on the destination network are one of the main factors that determines the cost. On Obyte, the fees are fractions of a cent while on Ethereum the total fees required to receive a transfer are about $16 (assuming 20 gwei gas price and 1 ETH = $2,000). These fees don't depend on the size of the transfer, that's why larger transfers are less expensive percentage-wise. On top of that, you need to pay a reward to an assistant who helps you to receive your transfer. This website sets the reward to 1% but it may go down in the future thanks to competition among assistants.
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
            Yes, you can, if you send a transfer that is larger than any assistant can process. In this case, you have an option to claim the transfer yourself or wait for an assistant to refill their capital and claim your transfer. If you decide to claim yourself, you'll need to pay a stake, and you'll be able to withdraw your transfer, along with the stake, on the destination chain only several days later (3 days by default). This website will update the status of your transfer and guide you through the process.
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
          header="Can I be an assistant myself?"
          key="4.6"
          className={styles.panel}
        >
          <p>
            Yes, you can be an assistant and make money from assistant rewards. Assistants are bots, you need to run it 24/7 and supply it with some capital that it'll use to claim transfers and challenge fraudulent transfers. See <a href="https://github.com/byteball/counterstake-bridge" target="_blank" rel="noopener">this github repo about setting up an assistant bot</a>.
          </p>
          <p>
            Alternatively, if you are not technical enough to run a bot yourself, you can contribute capital to <i>pooled assistants</i> operated by a manager, and share their profits.
          </p>
        </Panel>

        <Panel
          header="What chains are supported?"
          key="5"
          className={styles.panel}
        >
          <p>
            Counterstake protocol can connect any two chains that support some form of on-chain <i>programmable agents</i>: Autonomous Agents on Obyte, Smart Contracts on Ethereum, Chaincode on Hyperledger Fabric, etc. It is currently implemented for Obyte, Ethereum, and Binance Smart Chain. Launching Counterstake on any other Obyte-based or EVM-compatible chain is as easy as <a href="https://github.com/byteball/counterstake-bridge" target="_blank" rel="noopener">deploying the relevant code</a> on these chains.
          </p>
        </Panel>

        <Panel
          header="Is Counterstake protocol decentralized?"
          key="6"
          className={styles.panel}
        >
          <p>
            Yes, by design. Some other cross-chain bridge protocols rely on central custodians, operators, storemen, multisig signers, MPC signers, federated signers, etc. There is nothing like that in Counterstake. Participation is open, anybody can become an assistant or even claim their transfers themselves without the help of assistants.
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
          header="How does Counterstake compare against other cross-chain bridges?"
          key="7.5"
          className={styles.panel}
        >
          <p>
            See below:
            <div style={{ maxWidth: 560, marginTop: 5 }}>
              <img src="/cross-chain-bridge-protocols.svg" alt="How does Counterstake compare against other cross-chain bridges?" />
            </div>
            Counterstake is absolutely decentralized and more universal than most other bridges.
          </p>
          <p>
            Note that centralized vs decentralized is not a black-or-white choice, there are varying degrees of decentralization offered by other protocols. For example, a group of custodians bound by a multisignature scheme (including similar technologies such as threshold signatures and MPC) would be more decentralized than a single custodian. A larger group would be more decentralized than a smaller group. A group that is free to join would be more decentralized than a closed group. Absence of any groups at all is the gold standard of decentralization, which Counterstake meets.
          </p>
          <p>
            We care about decentralization not for the sake of decentralization but because it allows us to reduce risks of theft (by hackers or insiders), shut-down, censorship, or regulatory takeover. More decentralized protocols better protect the funds of their users, are harder to stop, are more open to new and small-cap coins, are less likely to censor specific transfers, users, or coins, and are less vulnerable to regulatory interference such as requirement of KYC and other requirements that might cause friction or infringe on privacy.
          </p>
          <p>
            The same goes about universality. Different protocols make different requirements to the chains they support, and some are more restrictive than others. Some protocols require custom implementations for each <i>direction</i> of transfer, thus making it N<sup>2</sup> amount of work to support N chains. Other protocols, including Counterstake, require a one-time implementation on each supported chain.
          </p>
          <p>
            We care about universality because it allows us to easily reuse knowledge and experience among various tokens and networks. For developers, universality means that the same APIs work across many tokens and networks.
          </p>
        </Panel>

        <Panel
          header="Can I call code/dapps on the remote chain?"
          key="7.6"
          className={styles.panel}
        >
          <p>
            Yes. If the recipient address is a programmable agent (autonomous agent, smart contract, etc), it will be called and receive the transferred money. You can also send data that would guide its execution. With some additional wiring, the receiving agent can be instructed to call back to the source chain and transfer some other token back. This way, the sending user doesn't even need to have an account on the destination chain.
          </p>
          <p>
            However, this website supports only sending fungible tokens, without data. Custom interfaces can be built for specific tasks, such as using <a href="https://oswap.io" target="_blank" rel="noopener">Oswap</a> from Ethereum without setting up an Obyte account, or vice versa using Uniswap from Obyte without an Ethereum account.
          </p>
        </Panel>

        <Panel
          header="Do I need to use Counterstake token?"
          key="8"
          className={styles.panel}
        >
          <p>
            No, the protocol does not require any new tokens. However note that by using the protocol you are making CS holders richer, as more use deflates their token faster. You might consider <Link to="/cs-token">becoming one</Link> as well.
          </p>
        </Panel>

      </Collapse>
      <div className={styles.action}>
        Any other questions? Ask on <a href="https://discord.obyte.org/" target="_blank" rel="noopener">Discord</a>.
      </div>
    </div>
  );
};
