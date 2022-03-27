import { Result } from "antd";
import QRButton from "obyte-qr-button";

import { generateLink } from "utils";

export const CreateBridgeSymbolStep = ({ symbol, asset, decimals, description }) => {
  const link = generateLink({ amount: 1e8, data: { symbol: String(symbol).toUpperCase(), asset, decimals, description }, aa: process.env.REACT_APP_TOKEN_REGISTRY });

  return <div>
    <Result
      title={`Create ${symbol} symbol`}
      extra={<QRButton type="primary" href={link}>Create</QRButton>}
      icon={<div />}
    />
  </div>
}