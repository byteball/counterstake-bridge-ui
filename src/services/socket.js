import { addTransfer, claimMyself, updateTransferStatus, withdrawalConfirmed } from "store/transfersSlice";
import obyte from "obyte";
import { isEmpty } from "lodash";
import { message } from "antd";

import { startWatchingDestinationBridge } from "./watch";
import { sendTransferToGA } from "./transfer";
import { store } from "index";
import { closeConnection, openConnection } from "store/connectionSlice";
import { getClaim } from "utils/getClaim";
import { changeGovernanceState } from "store/governanceSlice";
import { reqToCreateForward, saveForward, updateObyteAssistant } from "store/assistantsSlice";
import { getBalanceOfObyteWallet } from "store/thunks/getBalanceOfObyteWallet";
import { registerSymbolForPooledAssistant, updateAssistantOrderStatus, updateBridgeOrder } from "store/settingsSlice";
import { checkCreatedOrders } from "store/thunks/checkCreatedOrders";
import config from "appConfig";

const environment = config.ENVIRONMENT;
const forwardFactory = config.IMPORT_FORWARD_FACTORY;

let client = new obyte.Client(
  environment === 'devnet' ? 'ws://localhost:6611' : `wss://obyte.org/bb${environment === 'testnet' ? "-test" : ""}`,
  {
    testnet: environment === 'testnet',
    reconnect: true,
  }
);

const trackedSubjects = ["light/aa_request", "light/aa_response"];

const getAAPayload = (messages = []) => messages.find(m => m.app === 'data')?.payload || {};

const getAAPayment = (messages = [], recipients = [], asset) => messages.find(m => (m.app === 'payment') && (m?.payload?.asset === asset || !asset || (asset === "base" && !m?.payload?.asset)))?.payload?.outputs.find((o) => recipients.includes(o.address))?.amount || 0;


const handleEventBridge = async (err, result) => {
  const dispatch = store.dispatch;
  const state = store.getState();

  const transfers = state.transfers;

  const current_dest_addresses = Object.keys(state.destAddress).map((network) => state.destAddress[network]).filter((a) => a);

  const directions = state.directions;
  const { subject, body } = result[1];

  const { aa_address } = body;

  const createTransfer = (unit, sender_address, messages, dest_address) => {
    const direction = directions[aa_address];
    if (!direction)
      throw Error(`unknown direction of transfer received in ${unit} to ${aa_address}`);
    const { src_token, dst_token, dst_bridge_aa } = direction;
    const payload = getAAPayload(messages);
    const amount_in_pennies = getAAPayment(messages, [aa_address], src_token.asset);
    if (!amount_in_pennies)
      throw Error(`no amount in src asset in ${unit} to ${aa_address}`);
    const amount = amount_in_pennies / 10 ** src_token.decimals;
    const reward = (payload.reward || 0) / 10 ** src_token.decimals;
    const transfer = {
      src_token,
      dst_token,
      amount,
      reward,
      sender_address,
      dest_address,
      txid: unit,
      dst_bridge_aa,
      status: 'sent',
      ts: Date.now(),
    };
    startWatchingDestinationBridge(dst_token.network, dst_bridge_aa);
    sendTransferToGA(src_token, dst_token);
    return transfer;
  };

  const isRequest = subject === "light/aa_request";
  const isResponse = subject === "light/aa_response";

  if (isRequest) {
    const { messages, unit, authors: [{ address }] } = body.unit;
    const payload = getAAPayload(messages);

    // new transfer
    if (payload.foreign_address || payload.home_address) {
      const dest_address = payload.foreign_address || payload.home_address;
      if (!current_dest_addresses.includes(dest_address))
        return console.log(`transfer to somebody else's address ${dest_address} in ${unit}`);
      const transfer = createTransfer(unit, address, messages, dest_address);
      console.log(`new transfer req`, transfer)
      dispatch(addTransfer(transfer));
    }
    // new claim
    else if (payload.txid && payload.txts && payload.sender_address) {
      const transfer = transfers.find(t => t.txid === payload.txid);
      if (!transfer)
        return console.log(`claim of somebody else's transfer ${payload.txid} in ${unit}`)
      //transfer.status = 'claim_sent';
      if (address === transfer.dest_address) {
        dispatch(claimMyself({ txid: payload.txid }));
      }

      dispatch(updateTransferStatus({ txid: payload.txid, status: 'claimed', claim_txid: unit, claimant_address: address }));
    } else if (payload.withdraw && payload.claim_num !== undefined) {

      const transfer = transfers.find(t => t.self_claimed && (t.self_claimed_num !== undefined) && (Number(t.self_claimed_num) === Number(payload.claim_num)) && (body.aa_address === t.dst_bridge_aa));

      if (!transfer)
        return console.log(`withdrawal of somebody else's transfer`)

      dispatch(updateTransferStatus({ txid: transfer.txid, status: 'withdrawn' }));
    }
    else
      console.log(`neither transfer nor claim in ${unit}`);
  }
  else if (isResponse) {
    const { response, bounced, trigger_unit, trigger_address, timestamp } = body;
    if (bounced) return null;
    let { responseVars } = response;
    if (!responseVars)
      responseVars = {};
    let { message } = responseVars;
    if (!message)
      message = '';

    // new transfer
    if (message === 'started expatriation' || message === 'started repatriation') {
      const transfer = transfers.find(t => t.txid === trigger_unit);
      if (!transfer) {
        // maybe we missed the request?
        const dest_address = message === 'started expatriation' ? responseVars.foreign_address : responseVars.home_address;
        if (!current_dest_addresses.includes(dest_address))
          return console.log(`AA response to somebody else's transfer in ${trigger_unit}`);
        const resp = await client.api.getJoint(trigger_unit);
        if (!resp)
          throw Error(`failed to get trigger ${trigger_unit}`);
        const { unit: { messages, unit } } = resp.joint;
        const transfer = createTransfer(unit, trigger_address, messages, dest_address);
        transfer.status = 'confirmed';
        dispatch(addTransfer(transfer));
        return;
      }
      //transfer.status = 'confirmed';
      console.log(`transfer confirmed`, transfer)
      dispatch(updateTransferStatus({ txid: trigger_unit, status: 'confirmed', txts: timestamp }));
    }
    // new claim
    else if (responseVars.new_claim_num) {
      const resp = await client.api.getJoint(trigger_unit);
      if (!resp)
        throw Error(`failed to get trigger ${trigger_unit}`);
      const { unit: { messages, unit } } = resp.joint;
      const payload = getAAPayload(messages);
      const transfer = transfers.find(t => t.txid === payload.txid);

      if (!transfer)
        return console.log(`confirmed claim of somebody else's transfer ${payload.txid} in ${trigger_unit}`)

      if (trigger_address === transfer.dest_address) {
        dispatch(claimMyself({ txid: payload.txid, claim_num: responseVars.new_claim_num }));
      }

      const claim = await getClaim(responseVars.new_claim_num, body.aa_address, transfer.dst_token.network, false);

      dispatch(updateTransferStatus({ txid: payload.txid, status: 'claim_confirmed', claim_txid: unit, expiry_ts: claim?.expiry_ts, claimant_address: trigger_address }));

    }
    else if (message.includes("finished claim")) {
      const resp = await client.api.getJoint(trigger_unit);
      if (!resp)
        throw Error(`failed to get trigger ${trigger_unit}`);
      const { unit: { messages } } = resp.joint;
      const payload = getAAPayload(messages);
      const transfer = transfers.find(t => t.self_claimed && (t.self_claimed_num !== undefined) && (Number(t.self_claimed_num) === Number(payload.claim_num)) && (body.aa_address === t.dst_bridge_aa));

      if (!transfer)
        return console.log(`confirmed withdrawal of somebody else's transfer in ${trigger_unit}`)

      dispatch(updateTransferStatus({ txid: transfer.txid, status: 'withdrawal_confirmed' }));
      dispatch(withdrawalConfirmed({ txid: transfer.txid }))
    }
  }
  else
    throw Error(`neither request nor response ${subject}`);

};

const handleEventGovernance = (result) => {

  const { subject, body } = result[1];
  const { aa_address: address, updatedStateVars } = body;
  let diff = {};

  if (subject === "light/aa_response") {
    if (updatedStateVars) {
      for (let var_name in updatedStateVars[address]) {
        const value =
          updatedStateVars[address][var_name].value !== false
            ? updatedStateVars[address][var_name].value
            : undefined;
        diff[var_name] = value;
      }
    }

    if (!isEmpty(diff)) {
      store.dispatch(changeGovernanceState(diff))
    }
  }
}

const handleEventAssistant = (result) => {
  const state = store.getState();
  const dispatch = store.dispatch;

  const transfers = state.transfers;
  const { subject, body } = result[1];
  const { aa_address, updatedStateVars, balances, unit } = body;
  const author = unit?.authors?.[0]?.address;

  if (subject === "light/aa_request") {
    if (body?.unit?.messages) {
      const payload = getAAPayload(body?.unit?.messages);
      if (payload.txid && payload.txts && payload.sender_address) {
        const transfer = transfers.find(t => t.txid === payload.txid);
        if (transfer) {
          dispatch(updateTransferStatus({ txid: payload.txid, status: 'claimed', claim_txid: unit?.unit, claimant_address: body.aa_address }));
        } else {
          console.log(`claim of somebody else's transfer ${payload.txid} in ${unit?.unit}`)
        }
      }
    }
    if (state.destAddress?.Obyte && author && author === state.destAddress?.Obyte) {
      message.info("We have received your request. The interface will update after the transaction stabilizes", 5)
    }
  } else if (subject === "light/aa_response" && !state.assistants.forwards.includes(aa_address)) {
    let diff = {};

    if (updatedStateVars) {
      for (let var_name in updatedStateVars[aa_address]) {
        const value =
          updatedStateVars[aa_address][var_name].value !== false
            ? updatedStateVars[aa_address][var_name].value
            : undefined;
        diff[var_name] = value;
      }
    }

    if (!isEmpty(diff)) {
      store.dispatch(updateObyteAssistant({ address: aa_address, diff, balances }))
    }

    if (state.destAddress?.Obyte && body.trigger_initial_address === state.destAddress?.Obyte) {
      dispatch(getBalanceOfObyteWallet())
    }
  }
}

const handleEventAssistantFactory = async (result) => {
  const state = store.getState();
  const dispatch = store.dispatch;

  const { subject, body } = result[1];
  const { aa_address, updatedStateVars, unit, response, trigger_initial_unit } = body;
  const responseVars = response?.responseVars || {};

  if (subject === "light/aa_request") {
    if (body?.unit?.messages && state?.settings?.creationOrders?.assistant) {
      const order = state.settings.creationOrders.assistant;

      if (order.network === "Obyte") {
        const payload = getAAPayload(body.unit.messages);

        if (payload && payload.manager === order.manager && payload.bridge_aa === order.bridge_aa && order.factoryAddress === aa_address) {
          dispatch(updateAssistantOrderStatus({ status: "sent", txid: unit.unit }))
        }
      }
    }

    if (body?.unit?.messages && state?.settings?.creationOrders?.bridge) {
      const order = state.settings.creationOrders.bridge;
      const payload = getAAPayload(body.unit.messages);

      if (order.assistants_will_be_created && (!order.home_assistant_request || !order.foreign_assistant_request)) {
        if (order.home_network === "Obyte" && payload.bridge_aa === order.home_address && payload.manager === order.home_manager_address) {
          // req create home assistant
          dispatch(updateBridgeOrder({
            home_assistant_request: unit.unit
          }))

        } else if (order.foreign_network === "Obyte" && payload.bridge_aa === order.foreign_address && payload.manager === order.foreign_manager_address) {
          // req create foreign assistant
          dispatch(updateBridgeOrder({
            foreign_assistant_request: unit.unit
          }))
        }
      }
    }
  } else if (subject === "light/aa_response") {
    if (state?.settings?.creationOrders?.assistant) {
      const { address } = responseVars;
      const order = state.settings.creationOrders.assistant;

      if (address && trigger_initial_unit === order.txid) {
        const shares_asset = updatedStateVars[address]?.shares_asset?.value;
        dispatch(updateAssistantOrderStatus({ status: "created", address, shares_asset }));
      }
    }

    if (state?.settings?.creationOrders?.bridge) {
      const order = state.settings.creationOrders.bridge;
      const assistantAddress = responseVars.address;

      if (assistantAddress && order.assistants_will_be_created && ((order.home_network === "Obyte" && !order.home_assistant_shares_asset) || (order.foreign_network === "Obyte" && !order.foreign_assistant_shares_asset))) {

        const assistantShares = updatedStateVars[assistantAddress]?.shares_asset?.value;

        const bridge_aa = updatedStateVars[aa_address]?.[`assistant_${assistantAddress}`]?.value?.bridge_aa;

        if (order.home_network === "Obyte" && bridge_aa === order.home_address) {
          dispatch(updateBridgeOrder({
            home_assistant_address: assistantAddress,
            home_assistant_shares_asset: assistantShares
          }));
        } else if (order.foreign_network === "Obyte" && bridge_aa === order.foreign_address) {
          dispatch(updateBridgeOrder({
            foreign_assistant_address: assistantAddress,
            foreign_assistant_shares_asset: assistantShares
          }));
        }
      }
    }
  }
}

const handleEventTokenRegistry = (result) => {
  const state = store.getState();
  const dispatch = store.dispatch;

  const { subject, body } = result[1];

  if (subject === "light/aa_request") {
    if (body?.unit?.messages && state?.settings?.creationOrders?.assistant) {
      const order = state?.settings?.creationOrders?.assistant;
      const payload = getAAPayload(body.unit.messages);

      if (order.shares_asset === payload.asset) {
        dispatch(registerSymbolForPooledAssistant(payload.symbol))
      }
    }

    if (body?.unit?.messages && state?.settings?.creationOrders?.bridge) {
      const order = state?.settings?.creationOrders?.bridge;
      const payload = getAAPayload(body.unit.messages);

      if (order.home_assistant_shares_asset && order.home_assistant_shares_asset === payload.asset) {
        dispatch(updateBridgeOrder({
          home_assistant_symbol_request: true
        }));
      }

      if (order.foreign_assistant_shares_asset && order.foreign_assistant_shares_asset === payload.asset) {
        dispatch(updateBridgeOrder({
          foreign_assistant_symbol_request: true,
          status: "successful"
        }));
      }

      if (order.status === "created" && order.foreign_network === "Obyte" && order.foreign_asset === payload.asset) {
        dispatch(updateBridgeOrder({
          status: "symbol_created"
        }));
      }
    }
  }
}

const handleEventBridgeFactory = async (result) => {
  const state = store.getState();
  const dispatch = store.dispatch;

  if (state.settings?.creationOrders?.bridge) {
    const order = state?.settings?.creationOrders?.bridge;
    const { subject, body } = result[1];
    const { aa_address, unit } = body;

    if (subject === "light/aa_request") {
      const payload = getAAPayload(body.unit.messages);

      if (payload.home_asset && payload.stake_asset && config.OBYTE_IMPORT_FACTORY === aa_address) { // create import bridge
        if (order.home_asset && order.home_asset === payload.home_asset) {
          dispatch(updateBridgeOrder({
            foreign_bridge_request: unit.unit
          }))
        }
      } else if (payload.foreign_asset === order.foreign_asset && config.OBYTE_EXPORT_FACTORY === aa_address) { // create export bridge
        dispatch(updateBridgeOrder({
          home_bridge_request: unit.unit
        }))
      }

    } else if (subject === "light/aa_response") {
      if (order.foreign_bridge_request && order.foreign_network === "Obyte" && order.status === "configured") {
        const responses = await client.api.getAaResponseChain({ trigger_unit: order.foreign_bridge_request });
        const address = responses.find((res) => (res?.response?.responseVars) && ("address" in res.response.responseVars))?.response.responseVars.address || null;
        const asset = responses.find((res) => (res?.response?.responseVars) && ("asset" in res.response.responseVars))?.response.responseVars.asset || null;

        if (address && asset) {
          dispatch(updateBridgeOrder({
            foreign_address: address,
            foreign_asset: asset
          }))
        }
      } else if (order.home_bridge_request && order.home_network === "Obyte" && order.status === "configured") {
        const responses = await client.api.getAaResponseChain({ trigger_unit: order.home_bridge_request });
        const address = responses.find((res) => (res?.response?.responseVars) && ("address" in res.response.responseVars))?.response.responseVars.address || null;

        if (address) {
          dispatch(updateBridgeOrder({
            home_address: address,
            status: "created"
          }));
        }
      }
    }
  }
}

client.onConnect(() => {
  const dispatch = store.dispatch;
  const heartbeat = setInterval(function () {
    client.api.heartbeat();
  }, 10 * 1000);

  client.subscribe((err, result) => {
    if (err) return null;

    const state = store.getState();

    const { subject, body } = result[1];

    if (!subject || !trackedSubjects.includes(subject)) {
      if (subject === "joint" && state.destAddress?.Obyte) {
        dispatch(getBalanceOfObyteWallet())
      }
      return null;
    }

    const aa_address = body?.aa_address;

    if (aa_address === state.governance.activeGovernance) {
      handleEventGovernance(result)
    } else if (forwardFactory && (aa_address === forwardFactory)) {
      if (subject === "light/aa_request") {
        const { messages } = body.unit;
        const payload = getAAPayload(messages);
        if (payload.create && payload.assistant) {
          dispatch(reqToCreateForward(payload.assistant));
        }
      } else if (subject === "light/aa_response") {
        const { updatedStateVars } = body;
        if (updatedStateVars[forwardFactory]) {
          const varName = Object.keys(updatedStateVars[forwardFactory])?.[0];
          if (varName) {
            const assistant_address = varName.split("_")[2];
            if (obyte.utils.isValidAddress(assistant_address)) {
              const forward = updatedStateVars[forwardFactory][varName].value;
              if (obyte.utils.isValidAddress(forward)) {
                dispatch(saveForward({ assistant_address, forward }));
              }
            }
          }
        }
      }
    } else if ([...state.assistants.obyteAssistants, ...state.assistants.forwards].includes(aa_address)) {
      handleEventAssistant(result);
    } else if ([config.OBYTE_ASSISTANT_IMPORT_FACTORY, config.OBYTE_ASSISTANT_EXPORT_FACTORY].includes(aa_address)) {
      handleEventAssistantFactory(result);
    } else if (aa_address === config.TOKEN_REGISTRY) {
      handleEventTokenRegistry(result);
    } else if ([config.OBYTE_IMPORT_FACTORY, config.OBYTE_EXPORT_FACTORY].includes(aa_address)) {
      handleEventBridgeFactory(result);
    } else {
      handleEventBridge(err, result);
    }
  });

  dispatch(openConnection());
  dispatch(checkCreatedOrders());

  if (config.OBYTE_IMPORT_BASE_AAS.length >= 1) {
    config.OBYTE_IMPORT_BASE_AAS.forEach(aa => client.justsaying("light/new_aa_to_watch", { aa }));
  } else {
    console.error("Please specify ENV: REACT_APP_OBYTE_IMPORT_BASE_AAS")
  }

  if (config.OBYTE_EXPORT_BASE_AAS.length >= 1) {
    config.OBYTE_EXPORT_BASE_AAS.forEach(aa => client.justsaying("light/new_aa_to_watch", { aa }));
  } else {
    console.error("Please specify ENV: REACT_APP_OBYTE_EXPORT_BASE_AAS")
  }

  client.justsaying("light/new_aa_to_watch", { aa: config.OBYTE_ASSISTANT_IMPORT_FACTORY });
  client.justsaying("light/new_aa_to_watch", { aa: config.OBYTE_ASSISTANT_EXPORT_FACTORY });

  client.justsaying("light/new_aa_to_watch", { aa: config.OBYTE_IMPORT_FACTORY });
  client.justsaying("light/new_aa_to_watch", { aa: config.OBYTE_EXPORT_FACTORY });


  client.justsaying("light/new_aa_to_watch", {
    aa: config.TOKEN_REGISTRY
  });

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
    dispatch(closeConnection())
  });
});

export default client;
