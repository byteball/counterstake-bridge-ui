import { nativeSymbols } from "nativeSymbols";

export const filterBridgesByNetworks = (bridgesInfo) => {
  if (!bridgesInfo) return [];
  
  return bridgesInfo.filter(({ foreign_network, home_network }) =>
    ((foreign_network in nativeSymbols) || foreign_network === "Obyte") &&
    (home_network === "Obyte" || (home_network in nativeSymbols))
  );
};