import { createSelector } from "@reduxjs/toolkit";
import { ethers } from "ethers";

import { selectSupportedBridges } from "store/bridgesSlice";
import { EMPTY_FIELD, hasValue, selectAuditRows } from "store/auditSlice";

import { compareAmounts } from "./compareAmounts";

// USD is only an estimate for sorting and for the summary — the locked/issued comparison
// itself never goes through a float.
const toUsd = (raw, decimals, rate) => {
  if (raw === null || raw === undefined || !hasValue(rate)) return null;
  try {
    return parseFloat(ethers.utils.formatUnits(raw, decimals)) * rate.value;
  } catch (e) {
    return null;
  }
}

// The table always shows a column sort (Export balance, largest first, by default), so this is
// what breaks its ties — which is where the unpriced rows all end up. Deficits first among them,
// they are the reason to open this page at all, then alphabetically for a stable order.
const byImportance = (a, b) => {
  const deficit = Number(!!b.comparison?.isDeficit) - Number(!!a.comparison?.isDeficit);
  if (deficit) return deficit;

  const usd = (row) => row.lockedInUsd === null ? -Infinity : row.lockedInUsd;
  if (usd(a) !== usd(b)) return usd(b) - usd(a);

  return a.label.localeCompare(b.label);
}

export const selectAuditTableRows = createSelector(
  [selectSupportedBridges, selectAuditRows],
  (bridges, rows) => bridges.map((bridge) => {
    const { locked = EMPTY_FIELD, issued = EMPTY_FIELD, homeRate = EMPTY_FIELD, foreignRate = EMPTY_FIELD } = rows[bridge.bridge_id] || {};

    // derived from the values, not the statuses, so nothing disappears during a refresh
    const comparison = (hasValue(locked) && hasValue(issued))
      ? compareAmounts({
        locked: locked.value,
        lockedDecimals: bridge.home_asset_decimals,
        issued: issued.value,
        issuedDecimals: bridge.foreign_asset_decimals,
      })
      : null;

    return {
      key: bridge.bridge_id,
      bridge,
      label: `${bridge.home_symbol || bridge.home_asset}: ${bridge.home_network} → ${bridge.foreign_network}`,
      locked,
      issued,
      comparison,
      // each side is priced with its own rate: an image token on Obyte is worth what it trades
      // for there, which can differ from the home asset's global price
      isPriced: hasValue(homeRate) && hasValue(foreignRate),
      lockedInUsd: toUsd(locked.value, bridge.home_asset_decimals, homeRate),
      issuedInUsd: toUsd(issued.value, bridge.foreign_asset_decimals, foreignRate),
      // the surplus sits on the export side, so it is worth the home asset's rate — and keeps
      // the sign of the token amount, which a difference of two differently priced sides wouldn't
      excessInUsd: comparison ? toUsd(comparison.excess, comparison.scale, homeRate) : null,
    };
  }).sort(byImportance)
);

// Totals only count bridges priced on both sides, otherwise the two figures wouldn't be
// comparable with each other. Each total is the sum of its own column — including the excess,
// which is therefore valued at the home rates like the rows are, not as locked minus issued:
// the two sides are priced from different sources, and their difference can turn red under a
// column of green rows just because Oswap and the backend disagree on a price.
export const sumRows = (rows) => {
  let lockedInUsd = 0;
  let issuedInUsd = 0;
  let excessInUsd = 0;
  let priced = 0;

  for (const row of rows) {
    if (!row.isPriced) continue;
    priced += 1;
    lockedInUsd += row.lockedInUsd ?? 0;
    issuedInUsd += row.issuedInUsd ?? 0;
    excessInUsd += row.excessInUsd ?? 0;
  }

  return { lockedInUsd, issuedInUsd, excessInUsd, priced, total: rows.length };
}

export const selectAuditTotals = createSelector([selectAuditTableRows], sumRows);
