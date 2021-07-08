export const getStatusIndex = (network, status) => {
  if (network === "Obyte") {
    return ["sent", "confirmed", "claimed", "claim_confirmed", "withdrawn", "withdrawal_confirmed"].findIndex((s) => s === status);
  } else {
    return ["sent", "mined", "claimed", "claim_confirmed", "withdrawn", "withdrawal_confirmed"].findIndex((s) => s === status);
  }
}