import { nativeSymbols } from "nativeSymbols";

export const filterAssistantsByNetwork = (assistantsList) => {
  // support only EVM networks with native symbols and Obyte
  return assistantsList.filter(({ network }) => network in nativeSymbols || network === "Obyte");
};