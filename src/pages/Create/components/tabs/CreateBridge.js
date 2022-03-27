import { Button, Popconfirm, Steps } from "antd";
import { useDispatch, useSelector } from "react-redux";


import { removeCreationOrder, selectBridgeCreationOrder } from "store/settingsSlice";
import { useWindowSize } from "hooks/useWindowSize";
import { CreateBridgeStep } from "../CreateBridgeSteps/CreateBridgeStep";
import { CreateBridgeSymbolStep } from "../CreateBridgeSteps/CreateBridgeSymbolStep";
import { ConfigurationStep } from "../CreateBridgeSteps/ConfigurationStep";
import { CreateBridgeForm } from "../forms/CreateBridgeForm";
import { CreateBridgeAssistantsStep } from "../CreateBridgeSteps/CreateBridgeAssistantsStep";
import { SuccessfulStep } from "../CreateBridgeSteps/SuccessfulStep";

export const CreateBridge = () => {
  const dispatch = useDispatch();
  const actualOrder = useSelector(selectBridgeCreationOrder);
  const [width] = useWindowSize();

  const needsSymbolRegistration = actualOrder && actualOrder.foreign_network === "Obyte";

  const getActualStatusIndex = (status) => {
    const statusList = ["pending", "configured", "created"];

    if (needsSymbolRegistration) {
      statusList.push("symbol_created")
    }

    if (actualOrder.assistants_will_be_created) {
      statusList.push("assistant_created")
    }

    return statusList.findIndex(s => s === status)
  }

  const isSuccessfulOrder = actualOrder && (actualOrder.status === "successful" || (!actualOrder.assistants_will_be_created && ((actualOrder.status === "created" && !needsSymbolRegistration) || (needsSymbolRegistration && actualOrder.status === "symbol_created"))));

  return <div>
    {actualOrder && <div style={{ marginBottom: 40 }}>Creating {actualOrder.home_symbol} bridge from {actualOrder.home_network} to {actualOrder.foreign_network}</div>}

    {actualOrder && !isSuccessfulOrder && <Steps direction={width >= 560 ? "horizontal" : "vertical"} size="small" current={getActualStatusIndex(actualOrder?.status || null)} style={{ marginBottom: 30 }}>
      <Steps.Step title="Configure" />
      <Steps.Step title="Create bridge" />
      {needsSymbolRegistration && <Steps.Step title="Reg. symbol" />}
      {actualOrder.assistants_will_be_created && <Steps.Step title="Create assistants" />}
    </Steps>}

    {!actualOrder ? <CreateBridgeForm /> : <>
      {actualOrder.status === "pending" && <ConfigurationStep {...actualOrder} />}
      {actualOrder.status === "configured" && <CreateBridgeStep {...actualOrder} />}
      {actualOrder.status === "created" && needsSymbolRegistration && <CreateBridgeSymbolStep asset={actualOrder.foreign_asset} symbol={actualOrder.foreign_symbol} decimals={actualOrder.foreign_decimals} description={actualOrder.foreign_description} />}
      {((actualOrder.status === "created" && !needsSymbolRegistration) || actualOrder.status === "symbol_created") && actualOrder.assistants_will_be_created && <CreateBridgeAssistantsStep {...actualOrder} />}
      {isSuccessfulOrder && <SuccessfulStep />}
    </>}

    {actualOrder && !isSuccessfulOrder && <div style={{ textAlign: "center", marginTop: 50 }}>
      <Popconfirm
        title="Do you really want to cancel the creation?"
        onConfirm={() => dispatch(removeCreationOrder({ orderType: "bridge" }))}
        okText="Yes"
        cancelText="No"
      >
        <Button type="link" danger>Cancel and start over</Button>
      </Popconfirm>
    </div>}
  </div>
}