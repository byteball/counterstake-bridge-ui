import { message } from "antd";

// The user cancelled the transaction in the wallet (e.g. clicked "Reject" in MetaMask).
// This is an intentional action, not an error, so we don't show anything.
const isUserRejection = (e) =>
  e?.code === 4001 ||
  e?.code === "ACTION_REJECTED" ||
  e?.error?.code === 4001;

// Not enough balance to cover the transaction (value + gas). ethers normalizes this to the
// "INSUFFICIENT_FUNDS" code, but the underlying node/MetaMask error is sometimes only
// recognizable by its message, so we check the text as well.
const isInsufficientFunds = (e) => {
  if (e?.code === "INSUFFICIENT_FUNDS" || e?.error?.code === "INSUFFICIENT_FUNDS") return true;
  const text = (e?.error?.message || e?.data?.message || e?.message || "").toLowerCase();
  return text.includes("insufficient funds");
};

// Returns a human-readable message for an error thrown while sending an EVM transaction
// (insufficient funds, contract revert, network/RPC error, etc.), or null when there is
// nothing to show the user (the transaction was cancelled in the wallet). Always logs the
// full error for debugging.
export const getEvmErrorMessage = (e) => {
  console.error(e);

  if (isUserRejection(e)) return null;

  if (isInsufficientFunds(e)) return "Insufficient funds — please check your balance.";

  return e?.reason || e?.error?.message || e?.data?.message || e?.message || "An error occurred, please try again.";
};

export const handleEvmError = (e) => {
  const msg = getEvmErrorMessage(e);
  if (msg) message.error(msg);
};
