import { isPositiveAmount } from "store/governanceSlice";
import { formatAmount } from "utils/formatAmount";

export const getGovernanceOptionLabel = ({ symbol, network, type }) => `${symbol} on ${network} (${type})`;

export const GovernanceOption = ({ side }) => {
  const { symbol, decimals, balance } = side;
  const amount = isPositiveAmount(balance) ? formatAmount(balance, decimals, 5) : null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%" }}>
      <span>{getGovernanceOptionLabel(side)}</span>
      {amount && (
        <span style={{ opacity: .5, fontSize: 13, whiteSpace: "nowrap" }} title={amount.isTruncated ? `${amount.full} ${symbol}` : undefined}>
          Locked balance: {amount.display} {symbol}
        </span>
      )}
    </div>
  );
}
