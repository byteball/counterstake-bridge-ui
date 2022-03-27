import { Result } from "antd";
import { useDispatch } from "react-redux";

import { assistantFactoryAAs } from "pages/Create/components/tabs/CreateAssistant";
import { updateBridgeOrder } from "store/settingsSlice";
import { CreateAssistantStep, CreateSymbol } from "../tabs/CreateAssistant"
import { AssistantIcon } from "./AssistantIcon";

export const CreateBridgeAssistantsStep = ({
  home_network,
  home_assistant_address,
  foreign_assistant_address,
  home_address,
  home_manager_address,
  home_assistant_params,
  home_symbol,
  home_assistant_symbol_request,
  home_assistant_request,
  home_assistant_shares_asset,
  foreign_assistant_request,
  foreign_network,
  foreign_address,
  foreign_manager_address,
  foreign_symbol,
  foreign_assistant_params,
  foreign_assistant_shares_asset,
  foreign_assistant_symbol_request,
  home_assistant_shares_symbol,
  foreign_assistant_shares_symbol
}) => {
  const dispatch = useDispatch();

  let type;

  if (!home_assistant_address) {
    type = "home";
  } else {
    type = "foreign";
  }

  if ((type === "home" && !home_assistant_address) || (type === "foreign" && !foreign_assistant_address)) {

    if ((type === "home" && home_assistant_request && !home_assistant_address) || (type === "foreign" && foreign_assistant_request)) {
      return <Result
        title="Waiting for the transaction to finalize"
        subTitle="This usually takes up to 10 minutes."
        icon={<AssistantIcon network={type === "home" ? home_network : foreign_network} loading={true} />}
      />
    }
    
    return <CreateAssistantStep
      network={type === "home" ? home_network : foreign_network}
      bridge_aa={type === "home" ? home_address : foreign_address}
      manager={type === "home" ? home_manager_address : foreign_manager_address}
      exponent={1}
      shares_symbol={type === "home" ? home_assistant_shares_symbol : foreign_assistant_shares_symbol}
      symbol={type === "home" ? home_symbol : foreign_symbol}
      params={type === "home" ? home_assistant_params : foreign_assistant_params}
      type={type === "home" ? "export" : "import"}
      factoryAddress={assistantFactoryAAs[type === "home" ? home_network : foreign_network]?.[type === "home" ? "export" : "import"]}
      onRequest={(txid) => {
        const changes = type === "home" ? { home_assistant_request: txid } : { foreign_assistant_request: txid }
        dispatch(updateBridgeOrder(changes));
      }}
      onCreate={() => {
        const changes = type === "home" ? { home_assistant_address: true } : { foreign_assistant_address: true, status: "successful" }
        dispatch(updateBridgeOrder(changes));
      }}
    />
  } else {
    if (type === "home" ? (!home_assistant_symbol_request && home_network === "Obyte") : (!foreign_assistant_symbol_request && foreign_network === "Obyte")) {
      return <CreateSymbol
        shares_symbol={type === "home" ? home_assistant_shares_symbol : foreign_assistant_shares_symbol}
        shares_asset={type === "home" ? home_assistant_shares_asset : foreign_assistant_shares_asset}
        manager={type === "home" ? home_manager_address : foreign_manager_address}
        symbol={type === "home" ? home_symbol : foreign_symbol}
        type={type === "home" ? "export" : "import"}
      />
    } else {
      return null;
    }
  }
}