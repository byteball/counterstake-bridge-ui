import { BigNumber, ethers } from "ethers";

import { counterstakeFactoryAbi } from "abi";
import { changeNetwork } from "utils/changeNetwork";

export const createBridgeOnEVM = async ({
  type,
  foreign_network,
  foreign_asset,
  home_asset,
  large_threshold,
  home_network,
  challenging_periods,
  large_challenging_periods,
  foreign_description,
  foreign_symbol,
  stake_asset,
  oracles,
  onRequest,
  onResponse
}) => {

  let provider = new ethers.providers.Web3Provider(window.ethereum);

  let signer;

  if (window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    signer = provider.getSigner();

    const currentNetwork = await provider.getNetwork();

    const network = type === "export" ? home_network : foreign_network;

    if (currentNetwork !== network) {
      await changeNetwork(network);
    }
  } else {
    throw Error("Ethereum not found");
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();

  const large_threshold_bn = BigNumber.from(large_threshold);
  if (type === "export") {
    const contractAddress = getFactoryContractAddressByNetwork(home_network);
    const contract = new ethers.Contract(contractAddress, counterstakeFactoryAbi, signer);
    const res = await contract.createExport(foreign_network, foreign_asset, home_asset, 150, 100, large_threshold_bn, challenging_periods, large_challenging_periods);

    onRequest(res?.hash);

    const receipt = await res.wait();

    onResponse(receipt.events[0].args.contractAddress);

  } else if (type === "import") {
    const contractAddress = getFactoryContractAddressByNetwork(foreign_network);
    const contract = new ethers.Contract(contractAddress, counterstakeFactoryAbi, signer);

    const res = await contract.createImport(home_network, home_asset, foreign_description, foreign_symbol, stake_asset, oracles, 150, 100, large_threshold_bn, challenging_periods, large_challenging_periods);

    onRequest(res?.hash);

    const receipt = await res.wait();

    onResponse(receipt.events[0].args.contractAddress);
  }
}


export const getFactoryContractAddressByNetwork = (network) => {
  if (network === "Ethereum") {
    return process.env.REACT_APP_ETHEREUM_BRIDGE_FACTORY;
  } else if (network === "BSC") {
    return process.env.REACT_APP_BSC_BRIDGE_FACTORY;
  } else if (network === "Polygon") {
    return process.env.REACT_APP_POLYGON_BRIDGE_FACTORY
  } else {
    throw Error("unknown EVM network")
  }
} 