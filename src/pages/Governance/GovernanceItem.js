import { InfoCircleOutlined } from "@ant-design/icons"
import { Card, Button, Tooltip, Statistic } from "antd"
import { isEqual, isNumber } from "lodash";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import { useWindowSize } from "hooks/useWindowSize";
import { SupportListModal } from "modals/SupportListModal";
import { ChangeParamsModal } from "modals/ChangeParamsModal";
import { generateLink } from "utils";
import { getParameterList } from "./utils/getParameterList";
import { viewParam } from "./utils/viewParam";
import { EVMBridgeGovernance } from "./utils/EVMBridgeGovernance";
import { applyCommit } from "store/governanceSlice";
import { updateActiveGovernanceAA } from "store/thunks/updateActiveGovernanceAA";

import styles from "./GovernanceItem.module.css";


const linkStyles = { padding: 0, height: "auto" };
const { Countdown } = Statistic;

/* eslint eqeqeq: "off" */

export const GovernanceItem = (props) => {
  const { name, value, selectedBridgeAddress, activeGovernance, choice, bridge_network, leader, voteTokenDecimals, voteTokenAddress, voteTokenSymbol, stakeTokenDecimals, stakeTokenSymbol, challenging_period, freeze_period, supports = {}, challenging_period_start_ts, change, balance, activeWallet, contract_address } = props;
  const { rule, description } = getParameterList(bridge_network)?.[name];

  const valueView = viewParam({ name, value, network: bridge_network, stakeTokenDecimals, stakeTokenSymbol });
  const choiceView = viewParam({ name, value: choice, network: bridge_network, stakeTokenDecimals, stakeTokenSymbol });
  const leaderView = viewParam({ name, value: leader, network: bridge_network, stakeTokenDecimals, stakeTokenSymbol });

  const [width] = useWindowSize();
  const dispatch = useDispatch();

  const [isFrozen, setIsFrozen] = useState(challenging_period_start_ts && ((challenging_period_start_ts + challenging_period + freeze_period) * 1000) > Date.now());
  const [expiredChallengingPeriod, setExpiredChallengingPeriod] = useState(((challenging_period_start_ts + challenging_period) * 1000) < Date.now());

  useEffect(() => {
    setExpiredChallengingPeriod(((challenging_period_start_ts + challenging_period) * 1000) < Date.now());
  }, [challenging_period_start_ts, challenging_period, balance, activeGovernance])

  useEffect(() => {
    let intervalId;
    setIsFrozen(((challenging_period_start_ts + challenging_period + freeze_period) * 1000) > Date.now());
    if (challenging_period_start_ts && isFrozen === true) {
      intervalId = setInterval(() => {
        if (((challenging_period_start_ts + challenging_period + freeze_period) * 1000) < Date.now()) {
          setIsFrozen(false);
          clearInterval(intervalId);
        }
      }, 10 * 1000)
    }
    return () => intervalId !== undefined && clearInterval(intervalId);
  }, [choice, isFrozen, challenging_period_start_ts, challenging_period])

  const supportsByValue = Object.keys(supports).map((value) => ({
    value, supports: supports[value].reduce(function (sum, current) {
      return sum + current.support;
    }, 0)
  }));

  const commitLink = bridge_network === "Obyte" ? generateLink({
    asset: voteTokenAddress,
    amount: 1e4,
    data: {
      name, commit: 1
    },
    aa: activeGovernance,
    is_single: true,
    from_address: activeWallet
  }) : undefined;

  const linkRemoveSupport = bridge_network === "Obyte" ? generateLink({
    asset: voteTokenAddress,
    amount: 1e4,
    data: {
      name
    },
    aa: activeGovernance,
    is_single: true,
    from_address: activeWallet
  }) : undefined;

  const remove = async () => {
    if (bridge_network === "Obyte" || !window.ethereum) return;
    try {
      const EVM = new EVMBridgeGovernance(bridge_network, selectedBridgeAddress, voteTokenDecimals, activeWallet);

      await EVM.remove(name, contract_address, () => {
        dispatch(updateActiveGovernanceAA())
      })
    } catch (e) {
      console.log("remove error", e);
    }
  }

  const commit = async () => {
    if (bridge_network === "Obyte" || !window.ethereum) return;
    try {
      const EVM = new EVMBridgeGovernance(bridge_network, selectedBridgeAddress, voteTokenDecimals, activeWallet);

      await EVM.commit(name, contract_address, () => {
        dispatch(applyCommit(name));
      })
    } catch (e) {
      console.log("commit error", e);
    }
  }

  const metamaskInstalledOrNotRequired = bridge_network === "Obyte" || window.ethereum;

  return <Card style={{ marginTop: 20, marginBottom: 20 }} key={name + value}>
    <div className={styles.header}>
      <div className={styles.paramName}>
        {name.split("_").join(" ")}
        <Tooltip title={description}>
          <InfoCircleOutlined style={{ marginLeft: 10 }} />
        </Tooltip>
      </div>
      <div className={styles.headerValue}><span className={styles.label}>Current value</span>: <span className={name === "oracles" ? "evmHashOrAddress" : ""} style={name === "oracles" ? { textTransform: "none" } : {}}>{valueView}</span></div>
    </div>
    {leader !== undefined && (!isEqual(leader, value)) && <div className={styles.leaderWrap}>
      <div className={styles.leaderValue}>
        <b>Leader:</b> <span className={name === "oracles" ? "evmHashOrAddress" : ""}>{leaderView}</span>
      </div>
      <div>
        {expiredChallengingPeriod ?
          <Button type="link" disabled={!activeWallet || isEqual(leaderView, valueView) || value == leader || !metamaskInstalledOrNotRequired} style={linkStyles} href={commitLink} onClick={commit}>
            commit
          </Button> : (challenging_period_start_ts && <>Challenging period expires in <Countdown style={{ display: "inline" }} onFinish={() => setExpiredChallengingPeriod(true)} valueStyle={{ fontSize: 14, display: "inline", wordBreak: "break-all" }} value={(challenging_period_start_ts + challenging_period) * 1000} format={challenging_period > 86400 ? "D [days] HH:mm:ss" : "HH:mm:ss"} /></>)}
      </div>
    </div>}
    {choice !== undefined && <div className={styles.choiceWrap}>
      <div className={styles.choiceValue}>
        <b>My choice:</b> <span className={name === "oracles" ? "evmHashOrAddress" : ""}>{choiceView}</span>
      </div>
      <div>
        <Tooltip title={((isEqual(choice, leader) || choice === leader) && isFrozen) ? "Your choice is the leader and you'll be able to remove your support only after the challenging period and freeze period expire, or if some other value becomes the leader." : null}>
          <Button type="link" disabled={((isEqual(choice, leader) || choice === leader) && isFrozen) || !activeWallet || !metamaskInstalledOrNotRequired} style={linkStyles} href={linkRemoveSupport} onClick={remove}>
            remove support
          </Button>
        </Tooltip>
      </div>
    </div>}
    {supportsByValue.length > 0 && <div className={styles.listOfVoters}>
      <div className={styles.listOfVotersTitle}>List of voters</div>
      <div className={styles.listOfVotersHeader}>
        <div className={styles.listOfVotersValue}><b>Value</b></div>
        <div className={styles.listOfVotersSupport}><b>Support</b></div>
      </div>
      {supportsByValue.map(({ value, supports: supportedValue }, i) => <div key={i + " " + value} className={styles.listOfVotersItem}>
        <div className={styles.listOfVotersValue}>{width <= 780 && <b>Value: </b>}<span className={name === "oracles" ? "evmHashOrAddress" : ""}>{viewParam({ name, value, network: bridge_network, stakeTokenDecimals, stakeTokenSymbol })}</span></div>
        <div className={styles.listOfVotersSupport}>{width <= 780 && <b>Support: </b>} <SupportListModal sum={+Number(supportedValue / 10 ** voteTokenDecimals).toFixed(voteTokenDecimals)} decimals={voteTokenDecimals} symbol={voteTokenSymbol} supportList={supports[value]} bridge_network={bridge_network} /> </div>
        <div className={styles.listOfVotersAction}><ChangeParamsModal change={change} {...props} disabled={(choice !== undefined && isFrozen && (choice == leader || isEqual(leader, choice))) || !activeWallet || !metamaskInstalledOrNotRequired} rule={rule} description={description} balance={balance} supportedValue={value} isMyChoice={choice !== undefined && (isNumber(choice) ? Number(choice) === Number(value) : choice === value)} /></div>
      </div>)}
    </div>}
    <div className={styles.listOfVotersAnotherValue}>
      <ChangeParamsModal change={change} {...props} rule={rule} description={description} balance={balance} disabled={(choice !== undefined && isFrozen && (choice == leader || isEqual(leader, choice))) || !activeWallet || !metamaskInstalledOrNotRequired} />
    </div>
  </Card>
}
