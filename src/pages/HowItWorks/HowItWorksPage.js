import { Typography } from "antd";
import { Helmet } from "react-helmet-async";

import styles from "./HowItWorksPage.module.css";

import { ReactComponent as SeeSawOne } from "./img/seeSawOne.svg";
import { ReactComponent as SeeSawTwo } from "./img/seeSawTwo.svg";
import { ReactComponent as SeeSawThree } from "./img/seeSawThree.svg";
import { ReactComponent as SchellingPoints } from "./img/points.svg";
import { ReactComponent as Networks } from "./img/networks.svg";
import { ReactComponent as Process } from "./img/process.svg";


import { ReactComponent as ObyteLogo } from "./img/logo/obyte.svg";
import { ReactComponent as ETHLogo } from "./img/logo/eth.svg";
import { ReactComponent as BSCLogo } from "./img/logo/bsc.svg";
import { ReactComponent as EOSLogo } from "./img/logo/eos.svg";
import { ReactComponent as HyperledgerFabricLogo } from "./img/logo/hyperledger.svg";

const { Title, Paragraph } = Typography;

const logoList = [
  {
    name: "Obyte",
    icon: <ObyteLogo />,
    href: "https://obyte.org/"
  },
  {
    name: "ETH",
    icon: <ETHLogo />,
    href: "https://ethereum.org/"
  },
  {
    name: "BSC",
    icon: <BSCLogo />,
    href: "https://www.binance.com/en"
  },
  {
    name: "EOS",
    icon: <EOSLogo />,
    href: "https://eos.io/"
  },
  {
    name: "Hyperledger Fabric",
    icon: <HyperledgerFabricLogo />,
    href: "https://www.hyperledger.org/"
  }
]

export const HowItWorksPage = () =>
  <div>
    <Helmet title="Counterstake Bridge - How It Works" />
    <div className={styles.howItWorks}>
      <Title level={1}>How It Works</Title>

      <div className={styles.item}>
        <div className={styles.info}>
          <Paragraph>The idea of the Counterstake protocol for cross-chain transfers is very simple: when a user wants to transfer an asset from its home chain (such as GBYTE on Obyte or ETH on Ethereum), they lock the asset on the home chain and claim the same amount of the imported asset on the foreign chain. When claiming, they put up a stake that is equal to the amount they claim. The stake is paid in the foreign chain's native asset (ETH on Ethereum, GBYTE on Obyte). They'll get the stake back if the claim is legitimate, or lose it if the claim proves to be fraudulent.</Paragraph>
        </div>
        <div className={styles.image}>
          <SeeSawOne />
        </div>
      </div>

      <div className={styles.item}>
        <div className={styles.image}>
          <SeeSawTwo />
        </div>
        <div className={styles.info}>
          <Paragraph>This claim starts a challenging period. During this period, anyone can challenge the claim by counter-staking 1.5 the amount of the original stake if they think that the claim is fraudulent. The challengers are staking on the "No" outcome of the claim. If they are right and the original claim was fraudulent indeed, they stand to win the original stake from the claimant — a 66.7% ROI.</Paragraph>
        </div>
      </div>

      <div className={styles.item}>
        <div className={styles.info}>
          <Paragraph>The counterstake, if it happens, starts another challenging period, which is longer than the first one. During this period, anyone can support the original claim with their conterstakes if they believe that the original claim was legitimate and the first challenge was fraudulent. As soon as the total staked in favor of "Yes" reaches 1.5 times the total staked in favor of "No", "Yes" becomes the current outcome again and another challenging period starts.</Paragraph>
          <Paragraph>This pendulum can continue for several periods until a challenging period expires without the opposing side overturning the current outcome. Then, all the staked money is distributed among those who staked on the winning outcome. If the winning outcome is "Yes", the original claimant also gets their imported asset, which is issued for them on the foreign chain.</Paragraph>
        </div>
        <div className={styles.image}>
          <SeeSawThree />
        </div>
      </div>

      <div className={styles.item}>
        <div className={styles.imageSmall}>
          <SchellingPoints />
        </div>
        <div className={styles.info}>
          <Paragraph>In practice however, most claims will end after one period because there is objective truth that anyone who follows both the home and foreign chains can easily see. The truthful outcome is also the <a href="https://en.wikipedia.org/wiki/Focal_point_(game_theory)" target="_blank" rel="noopener">Schelling point</a>, and the community will quickly converge on the true outcome because everyone expects everyone else to stake on the true outcome. Even if a whale tries to repeatedly stake on the false outcome, the increasing length of the challenging periods will give the community enough time to mobilize and outweigh the whale's stake with the sum of many honest counterstakes.</Paragraph>
        </div>
      </div>

      <div className={styles.item}>
        <div className={styles.info}>
          <Paragraph>This process of exporting an asset from its home chain and getting the same amount of newly issued imported asset on the foreign chain is called <b>expatriation</b>. The imported asset, such as GBYTE on Ethereum or ETH on Obyte, naturally represents the original asset on the foreign chain. After using the imported asset on the foreign chain, the same or another user can <b>repatriate</b> it back to the home chain by burning the imported asset on the foreign chain, claiming the burned amount on the home chain, and unlocking the previously locked asset on the home chain if the claim succeeds.</Paragraph>
          <Paragraph>As long as the protocol works correctly and its watchdogs successfully challenge all fraudulent claims, the total amount of the imported asset issued on the foreign chain exactly matches the total amount of the exported asset locked on its home chain. Its total circulating supply stays the same, just part of the coins "travel" in foreign chains.</Paragraph>
        </div>
        <div className={styles.image}>
          <Networks />
        </div>
      </div>

      <div className={styles.item}>
        <div className={styles.image}>
          <Process />
        </div>
        <div className={styles.info}>
          <Paragraph>The described process might take rather long time as the user has to wait for at least one challenging period, and the period has to be long enough to give the challengers enough time to counterstake on fraudulent claims. The first challenging period is 3 days by default.</Paragraph>
          <Paragraph>However, <b>assistants</b> can accelerate the process for users by claiming the transfers for them and immediately paying the claimed coins to the user, less a reward to the assistant. The assistant will then wait for the challenging period to expire, defend the claim if necessary, and withdraw the claimed coins with profit. When sending a transfer, users indicate the reward they are prepared to pay to an assistant who picks their transfer. The reward should be large enough to cover the network fees on the destination chain and make a profit for the assistant that is adequate to the risk the assistant takes and the capital they lock in claims.</Paragraph>
          <Paragraph>Assistants can be either solo assistants or pooled ones that pool the capital from several investors and are operated by a manager. Pooled assistants are more likely to process large transfers. Assistants usually double as watchdogs and can challenge fraudulent claims as well as help users accelerate their transfers.</Paragraph>
        </div>
      </div>

      <div className={styles.item}>
        <div className={styles.info}>
          <Paragraph>Both home and foreign chains should support some form of on-chain <i>programmable agents</i> that facilitate locking, claiming, issuing new tokens, and burning. Programmable agents are known by different names on different chains — <a href="https://obyte.org/platform/autonomous-agents" target="_blank" rel="noopener">autonomous agents</a> on Obyte, smart contracts on Ethereum, chaincode on Hyperledger Fabric. Most modern chains do support them: Obyte, Ethereum and other EVM based chains, EOS, etc, and Counterstake protocol enables interoperability between all such networks.</Paragraph>
        </div>

        <div className={styles.icons}>
          {logoList.map(({ icon, href, name }) => <a target="_blank" rel="noopener" key={name} href={href}>{icon}</a>)}
        </div>
      </div>

    </div>
  </div>

