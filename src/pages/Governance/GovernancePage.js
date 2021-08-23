import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async"
import { Select, Spin, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { selectDestAddress } from "store/destAddressSlice";
import { selectBridgeAAs, selectGovernance, selectList } from "store/governanceSlice";
import { changeActiveGovernanceAA } from "store/thunks/changeActiveGovernanceAA";
import { GovernanceList } from "./GovernanceList";
import { Withdraw } from "./Withdraw";

import historyInstance from "historyInstance";
import styles from "./GovernancePage.module.css";

const { Title } = Typography;
const { Option } = Select;

export const GovernancePage = () => {
  const bridgeAAs = useSelector(selectBridgeAAs);
  const list = useSelector(selectList);
  const { loading, selectedBridgeAddress, bridge_network, type, paramsInfo, activeGovernance, voteTokenDecimals, voteTokenSymbol, voteTokenAddress, stakeTokenDecimals, stakeTokenSymbol, stakeTokenAddress, challenging_period, bridge_symbol, bridge_decimals, freeze_period, balances, home_asset_decimals } = useSelector(selectGovernance);
  const addresses = useSelector(selectDestAddress);
  const dispatch = useDispatch();
  const { address } = useParams();
  const [inited, setInited] = useState(false);

  const currentAddress = addresses?.[bridge_network];

  const handleChange = (aa) => {
    if (bridgeAAs && Object.keys(bridgeAAs).length > 0) {
      dispatch(changeActiveGovernanceAA({ bridge_aa: aa }))
    }
  }

  useEffect(() => {
    if (bridgeAAs && Object.keys(bridgeAAs).length > 0) {
      if (!inited) {
        if (address) {
          dispatch(changeActiveGovernanceAA({ bridge_aa: address }))
        }
        setInited(true);
      } else {
        if ((selectedBridgeAddress !== address) && selectedBridgeAddress) {
          historyInstance.replace(`/governance/${selectedBridgeAddress}`)
        }
      }
    }
  }, [address, inited, selectedBridgeAddress, bridgeAAs]);

  useEffect(() => {
    if (inited) {
      dispatch(changeActiveGovernanceAA({ bridge_aa: address }))
    }
  }, [addresses]);

  return <div className={styles.governance}>
    <Helmet title="Counterstake Bridge - Governance" />
    <Title level={1}>Governance</Title>

    <Select value={selectedBridgeAddress} optionFilterProp="children" showSearch loading={Object.keys(bridgeAAs).length === 0} onChange={handleChange} style={{ width: "100%" }} size="large" placeholder="Please select a coin to govern">
      {list?.map((item) => <Select.OptGroup key={item.bridge_label + item.import + item.export} label={<b style={{ fontSize: 14 }}>{item.bridge_label}</b>}>
        <Option style={{ height: 45, display: "flex", alignItems: "center" }} value={item.export}>{bridgeAAs[item.export].symbol} on {bridgeAAs[item.export].network} ({bridgeAAs[item.export].type})</Option>
        <Option style={{ height: 45, display: "flex", alignItems: "center" }} value={item.import}>{bridgeAAs[item.import].symbol} on {bridgeAAs[item.import].network} ({bridgeAAs[item.import].type})</Option>
      </Select.OptGroup>)}
    </Select>

    {selectedBridgeAddress && bridgeAAs && Object.keys(bridgeAAs).length > 0 && loading === false ? <div>
      <Withdraw
        voteTokenDecimals={voteTokenDecimals}
        voteTokenSymbol={voteTokenSymbol}
        balance={balances?.[currentAddress]}
        bridge_network={bridge_network}
        currentAddress={currentAddress}
        choiceParams={paramsInfo && Object.keys(paramsInfo).filter((name) => paramsInfo[name]?.choices && (currentAddress in paramsInfo[name]?.choices))}
        activeGovernance={activeGovernance}
        selectedBridgeAddress={selectedBridgeAddress}
      />

      <Title level={3}>Change parameters</Title>
      <GovernanceList
        type={type}

        bridge_network={bridge_network}
        bridge_symbol={bridge_symbol}
        bridge_decimals={bridge_decimals}

        home_asset_decimals={home_asset_decimals}
        selectedBridgeAddress={selectedBridgeAddress}
        paramsInfo={paramsInfo}
        activeGovernance={activeGovernance}

        voteTokenDecimals={voteTokenDecimals}
        voteTokenSymbol={voteTokenSymbol}
        voteTokenAddress={voteTokenAddress}

        stakeTokenDecimals={stakeTokenDecimals}
        stakeTokenSymbol={stakeTokenSymbol}
        stakeTokenAddress={stakeTokenAddress}

        challenging_period={challenging_period}
        freeze_period={freeze_period}
        activeWallet={currentAddress}
        balance={balances?.[currentAddress]}
      />
    </div> : <>
      {loading !== undefined && <div style={{ display: "flex", justifyContent: "center", margin: 50, transform: "scale(1.5)" }}>
        <Spin size="large" />
      </div>}
    </>}
  </div>
}