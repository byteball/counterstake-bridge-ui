import { Button, Result } from "antd";
import { BigNumber } from "ethers";
import QRButton from "obyte-qr-button";
import { useDispatch } from "react-redux";

import { updateBridgeOrder } from "store/settingsSlice";
import { generateLink } from "utils";
import { createBridgeOnEVM } from "../../utils/createBridgeOnEVM";
import { BridgeView } from "./BridgeView";

export const CreateBridgeStep = ({ home_address, foreign_address, foreign_params, home_params, home_decimals, home_network, home_asset, foreign_network, foreign_asset, oracles, foreign_decimals, foreign_bridge_request, home_bridge_request, foreign_symbol, foreign_description, home_symbol }) => {
  const dispatch = useDispatch();

  if (!foreign_address) { // create import
    const {
      challenging_periods,
      large_challenging_periods,
      large_threshold,
      min_stake,
      min_tx_age,
      stake_asset_decimals,
      stake_asset
    } = foreign_params;

    const link = foreign_network === "Obyte" ? generateLink({
      amount: 1e4,
      data: {
        asset_decimals: foreign_decimals,
        home_network,
        home_asset,
        stake_asset,
        stake_asset_decimals,
        challenging_periods,
        large_challenging_periods,
        large_threshold,
        min_stake,
        min_tx_age,
        oracles
      },
      aa: process.env.REACT_APP_OBYTE_IMPORT_FACTORY
    }) : "#";

    return <div>
      {!foreign_bridge_request ? <Result
        title={`Create bridge on ${foreign_network}`}
        subTitle={`${home_symbol}: ${home_network} -> ${foreign_network}`}
        extra={foreign_network === "Obyte" ? <QRButton type="primary" href={link}>Create</QRButton> : <Button type="primary" onClick={async () => {
          try {
            await createBridgeOnEVM({
              type: "import",
              home_asset,
              home_network,
              foreign_network,
              large_threshold,
              foreign_description,
              foreign_symbol,
              stake_asset,
              oracles,
              challenging_periods: challenging_periods.split(" ").map((v) => BigNumber.from(String(Number(v * 3600)))),
              large_challenging_periods: large_challenging_periods.split(" ").map((v) => BigNumber.from(String(Number(v * 3600)))),
              onRequest: (txid) => {
                dispatch(updateBridgeOrder({
                  foreign_bridge_request: txid
                }));
              },
              onResponse: (address) => {
                dispatch(updateBridgeOrder({
                  foreign_address: address,
                  foreign_asset: address
                }));
              }
            });
          } catch (e) {
            console.error("e", e)
            dispatch(updateBridgeOrder({
              foreign_address: undefined,
              foreign_asset: undefined,
              foreign_bridge_request: undefined
            }));
          }
        }}>Create</Button>}
        icon={<BridgeView
          home_network={home_network}
          foreign_network={foreign_network}
          home_address={home_address}
          foreign_address={foreign_address}
          home_bridge_request={home_bridge_request}
          foreign_bridge_request={foreign_bridge_request}
        />}
        style={{ padding: 0 }}
      /> : <Result
        title="Waiting for the transaction to finalize"
        subTitle="This usually takes up to 10 minutes."
        icon={<BridgeView
          home_network={home_network}
          foreign_network={foreign_network}
          home_address={home_address}
          foreign_address={foreign_address}
          home_bridge_request={home_bridge_request}
          foreign_bridge_request={foreign_bridge_request}
        />}
      />}
    </div>
  } else { // export

    const {
      large_threshold,
      challenging_periods,
      large_challenging_periods,
      min_stake,
      min_tx_age,
    } = home_params;

    const link = home_network === "Obyte" ? generateLink({
      amount: 1e4,
      data: {
        foreign_network,
        foreign_asset,
        asset: home_asset,
        asset_decimals: home_decimals,
        challenging_periods,
        large_challenging_periods,
        large_threshold,
        min_stake,
        min_tx_age
      },
      aa: process.env.REACT_APP_OBYTE_EXPORT_FACTORY
    }) : "#";

    return <div>
      {!home_bridge_request ? <Result
        title={`Create bridge on ${home_network}`}
        subTitle={`${home_symbol}: ${home_network} -> ${foreign_network}`}
        extra={home_network === "Obyte" ? <QRButton type="primary" href={link}>Create</QRButton> : <Button type="primary" onClick={async () => {
          try {
            await createBridgeOnEVM({
              type: "export",
              foreign_asset,
              home_asset,
              large_threshold,
              home_network,
              foreign_network,
              challenging_periods: challenging_periods.split(" ").map((v) => BigNumber.from(String(Number(v * 3600)))),
              large_challenging_periods: large_challenging_periods.split(" ").map((v) => BigNumber.from(String(Number(v * 3600)))),
              onRequest: (txid) => {
                dispatch(updateBridgeOrder({
                  home_bridge_request: txid
                }));
              },
              onResponse: (address) => {
                dispatch(updateBridgeOrder({
                  home_address: address,
                  status: "created"
                }))
              }
            });
          } catch (e) {
            console.error("e", e)
            dispatch(updateBridgeOrder({
              home_address: undefined,
              home_bridge_request: undefined
            }));
          }
        }}>Create</Button>}
        icon={<BridgeView
          home_network={home_network}
          foreign_network={foreign_network}
          home_address={home_address}
          foreign_address={foreign_address}
          home_bridge_request={home_bridge_request}
          foreign_bridge_request={foreign_bridge_request}
        />}
      /> : <Result
        title="Waiting for the transaction to finalize"
        subTitle="This usually takes up to 10 minutes."
        icon={<BridgeView
          home_network={home_network}
          foreign_network={foreign_network}
          home_address={home_address}
          foreign_address={foreign_address}
          home_bridge_request={home_bridge_request}
          foreign_bridge_request={foreign_bridge_request}
        />}
      />}
    </div>
  }
}