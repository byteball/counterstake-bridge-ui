import { ethers } from "ethers";
import { isNaN } from "lodash";
import obyte from "obyte";

const environment = process.env.REACT_APP_ENVIRONMENT;

export const getParameterList = (network) => ({
  ratio: {
    name: "ratio",
    evm_name: "ratio100",
    type: "uint",
    description: "The ratio between the stake and the claimed amount.",
    rule: "The value of the ratio parameter must be greater than to 0",
    initValue: 1,
    validator: value => value > 0
  },
  counterstake_coef: {
    name: "counterstake_coef",
    evm_name: "counterstake_coef100",
    type: "uint",
    description: "How much the stake grows in each subsequent challenging period.",
    rule: "The value of the counterstake_coef parameter must be greater than to 1",
    initValue: 1.5,
    validator: value => value > 1
  },
  min_tx_age: {
    name: "min_tx_age",
    type: "uint",
    description: "Minimum transaction age in seconds before it can be claimed.",
    rule: "The value of the min_tx_age parameter must be integer greater than or equal to 0",
    initValue: network === "Obyte" ? 30 : 0,
    validator: value => value >= 0
  },
  min_stake: {
    name: "min_stake",
    type: "uint",
    description: "Minimum stake amount.",
    rule: "The value of the min_stake parameter must be integer greater than or equal to 0",
    initValue: network === "Obyte" ? 100000 : 0,
    validator: value => value >= 0
  },
  large_threshold: {
    name: "large_threshold",
    type: "uint",
    description: "The threshold amount that makes a stake “large” and triggers longer challenging periods.",
    rule: "The value of the large_threshold parameter must be integer greater than or equal to 0",
    initValue: network === "Obyte" ? 100000000 : 0,
    validator: value => value >= 0
  },
  challenging_periods: {
    name: "challenging_periods",
    type: "unitArray",
    description: "Challenging periods (in hours) for regular amounts.",
    rule: "The value of the challenging_periods parameter must be Array of positive numbers. Numbers must be separated by a space and each of the numbers must be larger than the previous one. Example: 7 30 60 90 120",
    initValue: environment === "mainnet" ? [72, 168, 720, 1440] : [0.1, 0.2, 0.5, 1],
    validator: value => is_valid_challenging_periods_string(value, network)
  },
  large_challenging_periods: {
    name: "large_challenging_periods",
    type: "unitArray",
    description: "Challenging periods (in hours) for large amounts.",
    rule: "The value of the large_challenging_periods parameter must be Array of positive numbers. Numbers must be separated by a space and each of the numbers must be larger than the previous one. Example: 7 30 60 90 120",
    initValue: environment === "mainnet" ? [168, 720, 1440, 2160] : [0.2, 0.3, 0.7, 1.5],
    validator: value => is_valid_challenging_periods_string(value, network)
  },
  min_price: {
    name: "min_price",
    evm_name: "min_price20",
    type: "uint",
    description: "Minimum price of foreign asset in terms of stake asset. This overrides the price reported by the oracle if it is lower than the minimum and is meant to protect against malfunctioning oracle reporting a very low price.",
    rule: "The value of the min_price parameter must be integer greater than or equal to 0",
    initValue: 0,
    importOnly: true,
    validator: value => value >= 0
  },
  oracles: {
    name: "oracle",
    evm_name: "oracleAddress",
    type: "address",
    description: "Oracles that report the price of foreign asset in terms of stake asset.",
    initValue: 1,
    importOnly: true,
    validator: value => is_valid_oracle_string(value)
  }
});

export const is_valid_challenging_periods_string = (value) => {
  const valueFormatted = value.split(" ");

  if (valueFormatted.length > 20) return false;
  let isError = false;
  let prev = -1;

  valueFormatted?.forEach((period) => {
    if (isNaN(Number(period))) return isError = true;

    const nPeriod = Number(period);

    if (nPeriod <= 0 || (nPeriod > 3 * 365 * 24)) isError = true

    if (nPeriod < prev) return isError = true

    prev = nPeriod;
  });
  
  return !isError
}

export const is_valid_oracle_string = (value, network) => {
  if (network === "Obyte") {
    let isError = false;
    const pairs = value.split(" ");
    if (pairs > 3) return false
    pairs.forEach((pair) => {
      const oracle = String(pair).substring(0, 32);
      if (!obyte.utils.isValidAddress(oracle)) return isError = true;
      const op = String(pair).substring(32, 33);
      if (op !== '*' && op !== '/') return isError = true;
    });
    return !isError
  } else {
    try {
      return ethers.utils.getAddress(value) === value
    } catch (e) {
      return false
    }
  }
}