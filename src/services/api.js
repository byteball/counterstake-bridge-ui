import config from "appConfig";

const URL = config.BACKEND_URL;

const request = async (endpoint, options) => {
  const response = await fetch(`${URL}${endpoint}`, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    ...options
  });

  if (response.status !== 200) {
    const { error } = await response.json();
    throw new Error(error);
  }

  return await response.json();
}

export async function getBridges() {
  const resp_body = await request(`/bridges`);
  return resp_body;
}

export async function getTransferStatus(txid) {
  const resp_body = await request(`/transfer/?txid=${encodeURIComponent(txid)}`);
  return resp_body?.data;
}

export async function getPooledAssistants({reqBridgesInfo = false} = {}) {
  const resp_body = await request(`/pooled_assistants${reqBridgesInfo ? '?reqBridgesInfo=1' : ''}${reqBridgesInfo ? "&" : "?"}reqUsdRates=true`);
  return reqBridgesInfo ? resp_body : { assistants: resp_body };
}

export async function getTransfersByDestAddress(address) {
  if (!address) return [];
  
  const resp_body = await request(`/transfers/${encodeURIComponent(address)}`);
  return resp_body?.data;
}
