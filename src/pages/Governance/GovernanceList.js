import { Spin, List } from "antd";
import { useEffect, useState } from "react"

import { GovernanceItem } from "./GovernanceItem";

export const GovernanceList = ({ paramsInfo, selectedBridgeAddress, bridge_network, bridge_symbol, bridge_decimals, activeGovernance, voteTokenDecimals, voteTokenSymbol, voteTokenAddress, freeze_period, challenging_period, activeWallet, balance, home_asset_decimals, stakeTokenDecimals, stakeTokenSymbol, stakeTokenAddress, }) => {
  const [data, setData] = useState([]);
  
  useEffect(async () => {
      setData([]);
      const data = Object.keys(paramsInfo).map((name) => ({
        name,
        ...paramsInfo[name],
        choice: paramsInfo[name]?.choices?.[activeWallet]
      }));
      setData(data);
  }, [selectedBridgeAddress, paramsInfo, balance, activeWallet]);

  if (data.length === 0) return <div style={{ padding: 30, display: "flex", justifyContent: "center", width: "100%" }}>
    <Spin size="large" />
  </div>

  return <List
    dataSource={data}
    renderItem={params => {
      return <GovernanceItem
        voteTokenDecimals={voteTokenDecimals}
        voteTokenSymbol={voteTokenSymbol}
        voteTokenAddress={voteTokenAddress}

        stakeTokenDecimals={stakeTokenDecimals}
        stakeTokenSymbol={stakeTokenSymbol}
        stakeTokenAddress={stakeTokenAddress}

        activeGovernance={activeGovernance}
        selectedBridgeAddress={selectedBridgeAddress}
        freeze_period={freeze_period}
        challenging_period={challenging_period}

        bridge_network={bridge_network}
        bridge_decimals={bridge_decimals}
        bridge_symbol={bridge_symbol}

        balance={balance}
        activeWallet={activeWallet}
        home_asset_decimals={home_asset_decimals}
        {...params}
      />
    }}
    rowKey={(item) => item.name + item.value}
  />
}