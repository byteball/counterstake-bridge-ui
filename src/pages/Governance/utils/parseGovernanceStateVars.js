import obyte from "obyte";
import { getParameterList } from "./getParameterList";

export const parseGovernanceStateVars = (stateVars, network, type) => {
  const balances = {};
  const paramsInfo = {};
  const paramsInfoList = getParameterList(network);

  Object.keys(paramsInfoList).forEach((p) => type === "import" ? paramsInfo[p] = {} : (!paramsInfoList[p]?.importOnly) ? paramsInfo[p] = {} : null)
  // parse data from Obyte Network
  for (let key in stateVars) {
    if (key.includes("balance_")) {
      const address = key.split("_").slice(1)
      balances[address] = stateVars[key];
    } else if (key.includes("leader_")) {
      const param = key.split("_").slice(1).join("_");
      paramsInfo[param].leader = stateVars[key];
    } else if (key.includes("challenging_period_start_ts_")) {
      const param = key.split("_").slice(4).join("_");
      paramsInfo[param].challenging_period_start_ts = stateVars[key];
    } else if (key.includes("choice_")) {

      const [address, ...paramArray] = key.split("_").slice(1);
      const param = paramArray.join("_");

      if (!("choices" in paramsInfo[param])) {
        paramsInfo[param].choices = {};
      }

      paramsInfo[param].choices[address] = stateVars[key];

    } else if (key.includes("support_")) {
      const splitKey = key.split("_").slice(1);
      if (obyte.utils.isValidAddress(splitKey[splitKey.length - 1])) {
        const address = splitKey[splitKey.length - 1];
        const value = splitKey[splitKey.length - 2];
        const param = splitKey.slice(0, -2).join("_");
        if (paramsInfo[param].supports === undefined) paramsInfo[param].supports = {};

        if (paramsInfo[param].supports[value]) {
          paramsInfo[param].supports[value] = [...paramsInfo[param].supports[value], { address, support: stateVars[key] }]
        } else {
          paramsInfo[param].supports[value] = [{ address, support: stateVars[key] }]
        }
      }
    }
  }

  return {
    balances,
    paramsInfo
  }
}