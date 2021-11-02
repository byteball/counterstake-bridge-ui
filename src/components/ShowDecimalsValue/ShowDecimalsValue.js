import { Tooltip } from "antd";

export const ShowDecimalsValue = ({ value, decimals = 0, max_decimals }) => {
  if (value === 0 || value === "0") return 0;

  if (max_decimals === undefined || (decimals < max_decimals) || String(value / 10 ** decimals).split(".")?.[1]?.length <= max_decimals) {
    return +Number(value / 10 ** decimals).toFixed(max_decimals);
  } else {
    return <Tooltip title={+Number(value / 10 ** decimals).toFixed(decimals)}>{+Number(value / 10 ** decimals).toPrecision(max_decimals)}</Tooltip>
  }
}