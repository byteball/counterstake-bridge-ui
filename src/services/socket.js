import { addTransfer, claimMyself, updateTransferStatus, withdrawalConfirmed } from "store/transfersSlice";
import obyte from "obyte";
import { isEmpty } from "lodash";

import { startWatchingDestinationBridge } from "./watch";
import { sendTransferToGA } from "./transfer";
import { store } from "index";
import { closeConnection, openConnection } from "store/connectionSlice";
import { getClaim } from "utils/getClaim";
import { changeGovernanceState } from "store/governanceSlice";

const environment = process.env.REACT_APP_ENVIRONMENT;

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

client.onConnect(() => {
  const dispatch = store.dispatch;
  const heartbeat = setInterval(function () {
    client.api.heartbeat();
  }, 10 * 1000);

  client.subscribe((err, result) => {
    if (err) return null;
    const { subject, body } = result[1];

    if (!subject || !trackedSubjects.includes(subject)) {
      return null;
    }

    const state = store.getState();
    const aa_address = body?.aa_address;

    if (aa_address === state.governance.activeGovernance) {
      handleEventGovernance(result)
    } else {
      handleEventBridge(err, result);
    }
  });

  dispatch(openConnection())

  if (process.env.REACT_APP_OBYTE_IMPORT_BASE_AA) {
    client.justsaying("light/new_aa_to_watch", {
      aa: process.env.REACT_APP_OBYTE_IMPORT_BASE_AA
    });
  } else {
    console.error("Please specify ENV: REACT_APP_OBYTE_IMPORT_BASE_AA")
  }

  if (process.env.REACT_APP_OBYTE_EXPORT_BASE_AA) {
    client.justsaying("light/new_aa_to_watch", {
      aa: process.env.REACT_APP_OBYTE_EXPORT_BASE_AA
    });
  } else {
    console.error("Please specify ENV: REACT_APP_OBYTE_EXPORT_BASE_AA")
  }

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
    dispatch(closeConnection())
  });
});


export default client;
