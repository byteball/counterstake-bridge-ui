import { assistantFactoryAbi } from "abi";
import { ethers } from "ethers";
import { changeNetwork } from "utils/changeNetwork";

const environment = process.env.REACT_APP_ENVIRONMENT;

export const evmAssistantFactories = {
  Ethereum: environment === "mainnet" ? "0x12d40AA1861f32a08508ecE504269a1f12759F72" : "0x39F9CC0a70a5327e129B1Aab6b3B265fA0C03C01",
  BSC: environment === "mainnet" ? "0xd634330ca14524A43d193E1c2e92cbaB72952896" : "0x426D200d3572febdc2C154A58043bF9f857fb7E6",
  Polygon: environment === "mainnet" ? "0xE740C62aC78bB2666Fa9465052D0a292D7C27A11" : "0xd8BF89335214Caf4724739F52621bC6D70eF87bF"
}

export const createPooledAssistantOnEVM = async ({ type, network, bridge_aa, manager, management_fee, success_fee, swap_fee, exponent, symbol, bridgeSymbol, onRequest, onCreate }) => {

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
    const res = await contract.createExportAssistant(bridge_aa, manager, management_fee10000, success_fee10000, exponent, name, symbol);
    onRequest(res?.hash);
    await res.wait();
    onCreate();
  }
}