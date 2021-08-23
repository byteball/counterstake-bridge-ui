import { isArray } from "lodash";

export const viewParam = ({ name, value, network, stakeTokenDecimals, stakeTokenSymbol }) => {
  if (value === undefined) return null
  if (name === "oracles" && network === "Obyte") {
    const arrayValue = isArray(value) ? value : parseOracle(value.trim());
    return arrayValue.map((oracle, i) => {
      return <span key={name + '-' + oracle + "-" + i} style={{ display: "block" }}>{oracle.oracle + " " + oracle.feed_name + " \"" + oracle.op + "\""}</span>;
    })
  } if (network !== "Obyte" && ["ratio", "counterstake_coef"].includes(name)) {
    return Number(value) / 100
  } if ((name === "large_challenging_periods" || name === "challenging_periods") && isArray(value) && network !== "Obyte") {
    return value.map((v) => v / 3600).join(" ");
  } else if (name === "min_price" && network !== "Obyte") {
    return Number(value) / 1e20;
  } else if (name === "min_stake" || name === "large_threshold") {
    return `${value / 10 ** stakeTokenDecimals} ${stakeTokenSymbol}`
  } else {
    if (isArray(value)) {
      return value.join(" ")
    } else {
      return value
    }
  }
}

export const parseOracle = (oracles) => oracles.split(" ").map((info) => ({
  oracle: info.slice(0, 32),
  op: info.slice(32, 33),
  feed_name: info.slice(33, info.length)
}));