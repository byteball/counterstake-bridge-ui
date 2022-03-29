import { ethers } from "ethers";

import { assistantFactoryAbi } from "abi";
import { changeNetwork } from "utils/changeNetwork";
import config from "appConfig";

export const evmAssistantFactories = {
  Ethereum: config.ETHEREUM_ASSISTANT_FACTORY,
  BSC: config.BSC_ASSISTANT_FACTORY,
  Polygon: config.POLYGON_ASSISTANT_FACTORY
}

export const createPooledAssistantOnEVM = async ({ type, network, bridge_aa, manager, management_fee, success_fee, swap_fee, exponent, symbol, oracle, bridgeSymbol, onRequest, onCreate }) => {

  const contractAddress = evmAssistantFactories[network];

  if (!Object.keys(evmAssistantFactories).includes(network)) {
    throw Error("unknown network");
  }

  if (type !== "import" && type !== "export") {
    throw Error("unknown type");
  }

  let provider;
  let signer;

  const management_fee10000 = Math.ceil(management_fee * 1e4).toString();
  const success_fee10000 = Math.ceil(success_fee * 1e4).toString();
  const swap_fee10000 = Math.ceil(swap_fee * 1e4).toString();

  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const currentNetwork = await provider.getNetwork();
    if (currentNetwork !== network) {
      await changeNetwork(network);
    }
  } else {
    throw Error("Ethereum not found");
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();

  const contract = new ethers.Contract(contractAddress, assistantFactoryAbi, signer);

  const name = `${bridgeSymbol} export assistant shares`;

  if (type === "import") {
    const res = await contract.createImportAssistant(bridge_aa, manager, management_fee10000, success_fee10000, swap_fee10000, exponent, name, symbol);
    onRequest(res?.hash);
    await res.wait();
    onCreate();
  } else {
    const res = await contract.createExportAssistant(bridge_aa, manager, management_fee10000, success_fee10000, oracle, exponent, name, symbol);
    onRequest(res?.hash);
    await res.wait();
    onCreate();
  }
}