import { nativeSymbols } from "nativeSymbols";

export const filterAssistantsByNetwork = (assistantsList) => {
  return assistantsList.filter(({ network }) => network in nativeSymbols);
};