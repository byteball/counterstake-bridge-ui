import { addTransfer, updateTransferStatus } from "store/transfersSlice";
import obyte from "obyte";
import { startWatchingDestinationBridge } from "./watch";
import { sendTransferToGA } from "./transfer";
import { store } from "index";

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


const handleEvent = async (err, result) => {
  const dispatch = store.dispatch;
  const state = store.getState();
  //console.log('state', state)
  const transfers = state.transfers;
  const current_dest_address = state.destAddress;
  const directions = state.directions;

  if (err) return null;
  const { subject, body } = result[1];
  if (!subject || !trackedSubjects.includes(subject)) {
    return null;
  }

  const { aa_address } = body;

  const createTransfer = (unit, sender_address, messages, dest_address) => {
    const direction = directions[aa_address];
    if (!direction)
      throw Error(`unknown direction of transfer received in ${unit} to ${aa_address}`);
    const { src_token, dst_token } = direction;
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
      status: 'sent',
      ts: Date.now(),
    };
    startWatchingDestinationBridge(dst_token);
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
      if (dest_address !== current_dest_address)
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
      console.log(`new claim req`, transfer)
      dispatch(updateTransferStatus({ txid: payload.txid, status: 'claim_sent' }));
    }
    else
      console.log(`neither transfer nor claim in ${unit}`);
  }
  else if (isResponse) {
    const { response, bounced, trigger_unit, trigger_address } = body;
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
        if (dest_address !== current_dest_address)
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
      dispatch(updateTransferStatus({ txid: trigger_unit, status: 'confirmed' }));
    }
    // new claim
    else if (responseVars.new_claim_num) {
      const resp = await client.api.getJoint(trigger_unit);
      console.log('joint', resp)
      if (!resp)
        throw Error(`failed to get trigger ${trigger_unit}`);
      const { unit: { messages } } = resp.joint;
      const payload = getAAPayload(messages);
      const transfer = transfers.find(t => t.txid === payload.txid);
      if (!transfer)
        return console.log(`confirmed claim of somebody else's transfer ${payload.txid} in ${trigger_unit}`)
      //transfer.status = 'claim_confirmed';
      console.log(`claim confirmed`, transfer)
      dispatch(updateTransferStatus({ txid: payload.txid, status: 'claim_confirmed' }));
    }
  }
  else
    throw Error(`neither request nor response ${subject}`);

};

client.onConnect(() => {

  const heartbeat = setInterval(function () {
    client.api.heartbeat();
  }, 10 * 1000);

  client.subscribe(handleEvent);

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
  });
});


export default client;
