import { Result } from "antd";
import QRButton from "obyte-qr-button";

import { generateLink } from "utils";
import config from "appConfig";

export const CreateBridgeSymbolStep = ({ symbol, asset, decimals, description }) => {
  const link = generateLink({ amount: 1e8, data: { symbol: String(symbol).toUpperCase(), asset, decimals, description }, aa: config.TOKEN_REGISTRY });

  return <div>
    <Result
      title={`Create ${symbol} symbol on Obyte`}
      extra={<QRButton type="primary" href={link}>Create</QRButton>}
      icon={<div />}
    />
  </div>
}