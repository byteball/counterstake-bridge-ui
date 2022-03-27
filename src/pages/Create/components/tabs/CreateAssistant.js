import { CheckCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Result, Spin, Steps } from "antd"
import { useWindowSize } from "hooks/useWindowSize";
import QRButton from "obyte-qr-button";
import { useDispatch, useSelector } from "react-redux";

import { selectList } from "store/governanceSlice";
import { removeCreationOrder, updateAssistantOrderStatus } from "store/settingsSlice";
import { generateLink } from 'utils';
import { createPooledAssistantOnEVM } from "../../utils/createPooledAssistantOnEVM";
import { AssistantIcon } from "../CreateBridgeSteps/AssistantIcon";

export const assistantFactoryAAs = {
  Obyte: {
    import: process.env.REACT_APP_OBYTE_ASSISTANT_IMPORT_FACTORY,
    export: process.env.REACT_APP_OBYTE_ASSISTANT_EXPORT_FACTORY,
  },
}

export const CreateAssistant = ({ orderData = {} }) => {
  const { network, bridge_aa, status } = orderData;
  const bridgeList = useSelector(selectList);
  const dispatch = useDispatch();
  const [width] = useWindowSize();

  const currentBridge = bridgeList.find((bridge) => bridge.export === bridge_aa || bridge.import === bridge_aa)
  const label = currentBridge?.bridge_label;
  const isSuccessOrder = (status === "success" || (status === "created" && network !== "Obyte"));

  if (!label) return <div style={{ display: "flex", alignItems: "center" }}>
    <Spin style={{ transform: "scale(3)", padding: 10, margin: "0 auto" }} />
  </div>

  return <div>
    {network === "Obyte" && <>
      {status !== "success" && <Steps direction={width >= 560 ? "horizontal" : "vertical"} size="small" current={status === "created" ? 1 : 0}>
        <Steps.Step title="Create AA" />
        <Steps.Step title="Create symbol for shares" />
      </Steps>}
    </>}

    {status === "pending" && <CreateAssistantStep
      {...orderData}
      label={label}
      onRequest={
        (txid) => {
          dispatch(updateAssistantOrderStatus({ status: "sent", txid }));
        }
      }
      onCreate={
        () => {
          dispatch(updateAssistantOrderStatus({ status: "created" }));
        }
      }
    />}

    {status === "sent" && <>
      <Result
        title="Waiting for the transaction to finalize"
        subTitle="This usually takes up to 10 minutes."
        icon={<AssistantIcon network={network} loading={true} />}
      />
    </>}

    {status === "created" && network === "Obyte" && <CreateSymbol  {...orderData} label={label} />}

    {isSuccessOrder && <Success />}

    {!isSuccessOrder && <div style={{ textAlign: "center" }}>
      <Popconfirm
        title="Do you really want to cancel the creation?"
        onConfirm={() => dispatch(removeCreationOrder({ orderType: "assistant" }))}
        okText="Yes"
        cancelText="No"
      >
        <Button type="link" danger>Cancel and start over</Button>
      </Popconfirm>
    </div>}
  </div>
}



export const CreateAssistantStep = ({ network, manager, params, factoryAddress, bridge_aa, symbol, shares_symbol, label, type, onRequest, onCreate }) => {
  const link = network === "Obyte" ? generateLink({ amount: 1e4, data: { manager: manager, ...params, bridge_aa }, aa: factoryAddress }) : "#";

  const createEVMAssistant = () => {
    try {
      createPooledAssistantOnEVM({
        network,
        manager,
        bridge_aa,
        exponent: 1,
        ...params,
        symbol: shares_symbol,
        bridgeSymbol: symbol,
        type,
        onRequest,
        onCreate
      });
    } catch {}
  }

  return <div>
    <Result
      title={`Create assistant ${network === "Obyte" ? "AA" : "contract"} on ${network}`}
      subTitle={label}
      extra={network === "Obyte" ? <QRButton type="primary" href={link}>Create</QRButton> : <Button type="primary" onClick={createEVMAssistant}>Create</Button>}
      icon={<AssistantIcon network={network} />}
    />
  </div>
}

export const CreateSymbol = ({ shares_symbol, shares_asset, symbol, manager, type }) => {
  const link = generateLink({ amount: 1e8, data: { symbol: shares_symbol, asset: shares_asset, decimals: 9, description: `${symbol} ${type} assistant shares by ${manager}` }, aa: process.env.REACT_APP_TOKEN_REGISTRY });

  return <Result
    title={`Create ${shares_symbol} symbol for shares`}
    extra={<QRButton type="primary" href={link}>Create</QRButton>}
    icon={<div />}
  />
}

const Success = () => {
  const dispatch = useDispatch();

  return <Result
    title={`Assistant created successfully`}
    icon={<CheckCircleOutlined style={{ color: "#fff" }} />}
    extra={<Button type="primary" onClick={() => dispatch(removeCreationOrder({ orderType: "assistant" }))}>Create another bridge or assistant</Button>}
  />
}