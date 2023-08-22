import { Steps, Typography } from "antd";
import { Helmet } from "react-helmet-async";

import { ReactComponent as Chart } from "./img/chart.svg";

import styles from "./CSTokenPage.module.css";
import { SubscribeForm } from "components/SubscribeForm/SubscribeForm";

const { Title, Paragraph } = Typography;
const { Step } = Steps;

export const CSTokenPage = () => (<div>
  <Helmet>
    <title>Counterstake Bridge - CS Token</title>
  </Helmet>

  <div className={styles.csToken}>
    <Title level={1}>Counterstake Token</Title>

    <div style={{ marginBottom: 50 }}>
      <Paragraph>CS token will be designed to reflect the success of the Counterstake protocol. Its supply will automatically decrease as Counterstake protocol gets more widely used. The more actively the protocol is used, the faster the supply will decrease, leading to the token appreciation.</Paragraph>
      <Chart style={{ maxWidth: 560, margin: "50px auto", display: "block" }} />
      <Paragraph>The success of the protocol will be measured in terms of the total dollar amount of all coins "travelling" in foreign chains. For example, when 100 ETH get exported to Obyte, the travelling amount increases by the dollar value of 100 ETH. If 10 ETH get repatriated back to Ethereum, the travelling amount reduces accordingly. The total travelling amount gets summed up over all coins, all bridges, and all networks that use Counterstake protocol for bridging.</Paragraph>
      <Paragraph>The token is still being developed. Enter your email address below to get updates about the future token design and the upcoming token sale:</Paragraph>
      <SubscribeForm />
      <Paragraph>Note that the protocol itself is fully operational already now as the protocol doesn't require any new tokens.</Paragraph>
    </div>

    <div style={{ marginBottom: 50 }}>
      <Title level={2} style={{ fontSize: 27 }}>Market size</Title>
      <Paragraph>Interoperability plays an increasingly important role in crypto. It is certain that there will be many different chains optimized for different use cases and the value needs to be transferred between them in a safe and easy way.</Paragraph>
      <Paragraph>The amount of tokens transferred to foreign chains has grown significantly over the past 6 months. For Binance bridge alone (which is by far the biggest one) it is currently over $13b (<a href="https://bscscan.com/tokens" target="_blank" rel="noopener">source</a>) while on Jan 1, 2021 it was about $0.5b — roughly 25x growth.</Paragraph>
      <Title level={2} style={{ fontSize: 27 }}>Competitive advantage</Title>
      <Paragraph>
        Counterstake is absolutely decentralized and is one of the most universal cross-chain bridges.
        <div style={{ maxWidth: 560, margin: "50px auto", display: "block", opacity: 0.7 }}>
          <img src="/cross-chain-bridge-protocols.svg" alt="Counterstake is absolutely decentralized and is one of the most universal cross-chain bridges." />
        </div>
      </Paragraph>
    </div>

    <div style={{ marginBottom: 50 }}>
      <Title level={3} style={{ fontSize: 20 }}>Decentralization</Title>
      <Paragraph>
        Centralized vs decentralized is not a black-or-white choice, there are varying degrees of decentralization offered by other protocols. For example, a group of custodians bound by a multisignature scheme (including similar technologies such as threshold signatures and MPC) would be more decentralized than a single custodian. A larger group would be more decentralized than a smaller group. A group that is free to join would be more decentralized than a closed group. Absence of any groups at all is the gold standard of decentralization, which Counterstake meets.
      </Paragraph>
      <Paragraph>
        We care about decentralization not for the sake of decentralization but because it allows us to reduce risks of theft (by hackers or insiders), shut-down, censorship, or regulatory takeover. More decentralized protocols better protect the funds of their users, are harder to stop, are more open to new and small-cap coins, are less likely to censor specific transfers, users, or coins, and are less vulnerable to regulatory interference such as requirement of KYC and other requirements that might cause friction or infringe on privacy.
      </Paragraph>
    </div>

    <div style={{ marginBottom: 50 }}>
      <Title level={3} style={{ fontSize: 20 }}>Universality</Title>
      <Paragraph>
        Counterstake supports all tokens on all supported chains without any approvals or whitelistings. That's thousands of tokens. Implementations currently exist for Obyte tokens and ERC20 tokens on EVM-based chains (Ethereum, BSC, etc). Other chains that support programmable agents (autonomous agents, smart contracts, chaincode) can be easily added along with their respective tokens.
      </Paragraph>
      <Paragraph>
        Some other protocols require custom implementations for each <i>direction</i> of transfer, thus making it N<sup>2</sup> amount of work to support N chains. Counterstake requires a one-time implementation on each supported chain.
      </Paragraph>
      <Paragraph>
        We care about universality because it allows us to easily reuse knowledge and experience among various tokens and networks. For developers, universality means that the same APIs work across many tokens and networks.
      </Paragraph>
    </div>

    <div style={{ marginBottom: 50, marginLeft: 3 }}>
      <Title level={2} style={{ fontSize: 27, marginBottom: 16.5 }}>Roadmap</Title>
      <div>
        <Steps size="small" current={5} direction="vertical">
          <Step title="July 2021" description="Soft launch of the protocol" />
          <Step title="August 2021" description="Governance" />
          <Step title="November 2021" description="Pooled assistants" />
          <Step title="March 2022" description="Audits of smart contracts and autonomous agents" />
          <Step title="April 2022" description="Easy creation of new bridges and assistants through the UI" />
          <Step description="CS token design" />
          <Step description="CS token sale" />
          <Step description="CS token launch" />
          <Step description="General election: CS token holders will choose a team responsible for the development and adoption of the protocol during the next year" />
        </Steps>
      </div>
    </div>
    <div style={{ marginBottom: 50 }}>
      <Title level={2} style={{ fontSize: 27 }}>Subscribe to updates</Title>
      <Paragraph>Enter your email address below to get updates about the future token design and the upcoming token sale:</Paragraph>

      <SubscribeForm />
    </div>
  </div>
</div>)