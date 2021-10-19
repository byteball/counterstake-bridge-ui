import { Tooltip } from "antd";
import { ethers, BigNumber } from "ethers";

export const ShowDecimalsValue = ({ value, decimals = 0, max_decimals, network }) => {
  if (value === 0 || value === "0") return 0;

  if (network === "Obyte") {
    if (max_decimals === undefined || (decimals < max_decimals) || String(value / 10 ** decimals).split(".")?.[1]?.length <= max_decimals) {
      return +Number(value / 10 ** decimals).toFixed(max_decimals);
    } else {
      return <Tooltip title={+Number(value / 10 ** decimals).toFixed(decimals)}>{+Number(value / 10 ** decimals).toPrecision(max_decimals)}</Tooltip>
    }
  } else {
    if (max_decimals === undefined || (decimals < max_decimals) || ethers.utils.formatUnits(BigNumber.from(value), decimals).split(".")[1].length <= max_decimals) {
      return +ethers.utils.formatUnits(BigNumber.from(value), decimals);
    } else {
      return <Tooltip title={Number(+ethers.utils.formatUnits(BigNumber.from(value), decimals).toString()).toPrecision(decimals)}>{Number(+ethers.utils.formatUnits(BigNumber.from(value), decimals).toString()).toPrecision(max_decimals)}</Tooltip>
    }
  }

}