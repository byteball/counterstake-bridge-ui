import { BigNumber, FixedNumber } from "@ethersproject/bignumber";
import { Spin, Typography } from "antd";
import { ethers } from "ethers";
import { flattenDepth, groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux"
import { useLocation } from "react-router";

import { selectAssistants } from "store/assistantsSlice"
import { selectConnectionStatus } from "store/connectionSlice";
import { selectDirections } from "store/directionsSlice";
import { selectFilters, selectSortType } from "store/settingsSlice";
import { AssistantFiltersAndSort } from "./AssistantFiltersAndSort";
import { AssistantItem } from "./AssistantItem";
import { getAPY } from "./helpers/getAPY";

const { Title } = Typography;

export const AssistantList = () => {
  const assistants = useSelector(selectAssistants);
  const directions = useSelector(selectDirections);
  const sortingType = useSelector(selectSortType);
  const isOpenConnection = useSelector(selectConnectionStatus);
  const filters = useSelector(selectFilters);
  const [currentAssistant, setCurrentAssistant] = useState();

  const location = useLocation();

  const goToAssistant = (assistant_aa) => {
    if (assistant_aa) {
      if (location.hash) {
        const assistant = document.getElementById(assistant_aa);
        if (assistant) {
          assistant.scrollIntoView({ behavior: "smooth", block: "center" });
          assistant.style.boxShadow = "0px 0px 21px -2px #1A91FF";
          assistant.style.border = "none";
        }
      }
    }
  }

  const clearGoToAssistant = (assistant_aa) => {
    const assistant = document.getElementById(assistant_aa);
    if (assistant) {
      assistant.style.boxShadow = "none";
    }
  }

  useEffect(() => {
    if (Object.keys(assistants).length > 0 && Object.keys(directions).length > 0) {
      if (location.hash) {
        const assistant = location.hash.slice(1);
        if (assistant) {
          setCurrentAssistant(assistant);
          goToAssistant(assistant);
        }
      } else if (currentAssistant) {
        clearGoToAssistant(currentAssistant);
        setCurrentAssistant(undefined);
      }
    }
  }, [location.hash, currentAssistant, assistants]);

  if (Object.keys(directions).length === 0 || Object.keys(assistants).length === 0 || !isOpenConnection) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: 50, flexDirection: "column" }}>
    <Spin size="large" style={{ transform: "scale(1.5)" }} />
    <div style={{ padding: 10, fontSize: 16 }}>Loading...</div>
  </div>

  const filtersByType = groupBy(filters, "type");

  const filteredAssistants = Object.entries(assistants).map(([bridge, assistantsByBridge]) => {
    const filteredAssistantsByBridge = assistantsByBridge.filter((a) => {
      if (
        (filtersByType.manager ? filtersByType.manager.find((f) => f.value === a.manager) : true) &&
        (filtersByType.side ? filtersByType.side.find((f) => f.value === a.side) : true) &&
        (filtersByType.network ? filtersByType.network.find((f) => f.value === a.network) : true) &&
        (filtersByType.home_asset ? filtersByType.home_asset.find((f) => {
          const [address, network] = f.value.split("_");
          return (address === a.home_asset) && (!network || network === a.home_network)
        }) : true)
      ) {
        return true
      } else {
        if (Object.keys(filtersByType).length === 0) {
          return true
        }
        return false;
      }
    })
    return [bridge, filteredAssistantsByBridge]
  }).map(([bridge, assistants]) => {
    const assistantsWithAPY = assistants.map(a => ({
      ...a,
      APY: getAPY(a),
      totalBalanceInUSD: calcUsdBalance(a)
    }))
    return [bridge, assistantsWithAPY]
  });

  return <div style={{ marginTop: 40 }}>
    <AssistantFiltersAndSort />

    {sortingType === "bridge" && filteredAssistants.map(([bridge, assistantsByBridge], i) => {
      let bridge_label;
      if (directions[bridge].type === "expatriation") {
        bridge_label = `${directions[bridge].src_token.symbol}: ${directions[bridge].src_token.network} -> ${directions[bridge].dst_token.network} (export)`
      } else {
        bridge_label = `${directions[bridge].dst_token.symbol}: ${directions[bridge].dst_token.network} -> ${directions[bridge].src_token.network} (import)`
      }
      return <div key={bridge + "-" + i}>
        {sortingType === "bridge" && assistantsByBridge.length > 0 && <Title level={4}>{bridge_label}</Title>}
        {assistantsByBridge.map((info, index) => {
          return <div key={info.assistant_aa}>
            {sortingType !== "bridge" && <Title level={5}>{bridge_label}</Title>}
            <AssistantItem  {...info} />
          </div>
        })}
      </div>
    })}

    {sortingType !== "bridge" && flattenDepth(filteredAssistants.map(([_, assistantsByBridge], i) => assistantsByBridge)).sort(sortingType === "apy" ? (a, b) => b.APY - a.APY : (a, b) => b.totalBalanceInUSD - a.totalBalanceInUSD).map(({ bridge_aa, ...info }, index) => {
      let bridge_label;
      if (directions[bridge_aa].type === "expatriation") {
        bridge_label = `${directions[bridge_aa].src_token.symbol}: ${directions[bridge_aa].src_token.network} -> ${directions[bridge_aa].dst_token.network} (export)`
      } else {
        bridge_label = `${directions[bridge_aa].dst_token.symbol}: ${directions[bridge_aa].dst_token.network} -> ${directions[bridge_aa].src_token.network} (import)`
      }
      return <div key={info.assistant_aa}>
        {sortingType !== "bridge" && <Title level={5}>{bridge_label}</Title>}
        <AssistantItem  {...info} />
      </div>
    })}
  </div>
}

// helpers func
const calcUsdBalance = (a) => {
  const { network, side, stakeRateInUSD, imageRateInUSD } = a;

  if (side === "export" && !stakeRateInUSD) return 0;
  if (side === "import" && (!stakeRateInUSD || !imageRateInUSD)) return 0;

  if (network === "Obyte") {
    if (side === "export") {
      return ((a.stake_balance + (a.stake_balance_in_work || 0)) / 10 ** a.stake_asset_decimals) * stakeRateInUSD
    } else {
      if (a.stakeRateInUSD && a.imageRateInUSD) {
        return ((a.stake_balance + (a.stake_balance_in_work || 0)) / 10 ** a.stake_asset_decimals) * a.stakeRateInUSD + ((a.image_balance + (a.image_balance_in_work || 0)) / 10 ** a.image_asset_decimals) * imageRateInUSD
      }
    }
  } else {
    if (side === "export") {
      const grossBalanceInSmallestUnits = BigNumber.from(a.stake_balance).add(a.stake_balance_in_work).toString()
      const grossBalanceInFullUnits = ethers.utils.formatUnits(grossBalanceInSmallestUnits, a.stake_asset_decimals);
      return FixedNumber.from(grossBalanceInFullUnits).mulUnsafe(FixedNumber.from(String(stakeRateInUSD))).toString();
    } else {
      const stakeGrossBalanceInSmallestUnits = BigNumber.from(a.stake_balance).add(a.stake_balance_in_work).toString()
      const stakeGrossBalanceInFullUnits = ethers.utils.formatUnits(stakeGrossBalanceInSmallestUnits, a.stake_asset_decimals);

      const imageGrossBalanceInSmallestUnits = BigNumber.from(a.image_balance).add(a.image_balance_in_work).toString()
      const imageGrossBalanceInFullUnits = ethers.utils.formatUnits(imageGrossBalanceInSmallestUnits, a.image_asset_decimals);

      return FixedNumber.from(stakeGrossBalanceInFullUnits).mulUnsafe(FixedNumber.from(String(stakeRateInUSD))).addUnsafe(FixedNumber.from(imageGrossBalanceInFullUnits).mulUnsafe(FixedNumber.from(String(imageRateInUSD)))).toString()
    }
  }
}