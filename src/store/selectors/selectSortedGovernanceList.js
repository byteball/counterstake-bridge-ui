import { createSelector } from '@reduxjs/toolkit';
import { BigNumber, ethers } from 'ethers';

import { isPositiveAmount, selectList, selectLockedBalances } from '../governanceSlice';
import { selectDestAddress } from '../destAddressSlice';

const selectExportList = state => state.governance.exportList;
const selectImportList = state => state.governance.importList;

// token amount, decimals-normalised; -1 = nothing to show, so ties keep the alphabetical order
const lockedRank = (value, decimals) => {
  if (!isPositiveAmount(value)) return -1;
  try {
    return Number(ethers.utils.formatUnits(BigNumber.from(value), decimals || 0));
  } catch (e) {
    return -1;
  }
}

// the selected bridge uses the figure the page itself keeps up to date after a vote or a withdrawal
const selectSelectedLockedBalance = createSelector(
  [
    state => state.governance.selectedBridgeAddress,
    state => state.governance.loading,
    state => state.governance.bridge_network,
    state => state.governance.balances,
    selectDestAddress,
  ],
  (selectedBridgeAddress, loading, bridge_network, balances, destAddress) => {
    if (!selectedBridgeAddress || loading !== false) return null;
    const wallet = destAddress?.[bridge_network];
    if (!wallet) return null;
    const value = balances?.[wallet];
    return { bridge_aa: selectedBridgeAddress, value: value === undefined || value === null ? '0' : String(value) };
  }
);

export const selectSortedGovernanceList = createSelector(
  [selectList, selectExportList, selectImportList, selectLockedBalances, selectSelectedLockedBalance],
  (list, exportList, importList, lockedBalances, selected) => {
    const toSide = (bridge_aa) => {
      const aa = exportList?.[bridge_aa] || importList?.[bridge_aa];
      if (!aa) return null;
      const balance = selected?.bridge_aa === bridge_aa ? selected.value : lockedBalances[bridge_aa];
      return {
        bridge_aa,
        symbol: aa.symbol,
        network: aa.network,
        type: aa.type,
        decimals: aa.decimals,
        balance,
        rank: lockedRank(balance, aa.decimals),
      };
    }

    return (list || [])
      .map((item) => {
        const sides = [toSide(item.export), toSide(item.import)].filter(Boolean).sort((a, b) => b.rank - a.rank);
        return {
          key: item.bridge_label + item.import + item.export,
          bridge_label: item.bridge_label,
          sides,
          rank: sides.length ? Math.max(...sides.map(s => s.rank)) : -1,
        };
      })
      .sort((a, b) => b.rank - a.rank);
  }
);
