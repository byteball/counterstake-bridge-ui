import { BigNumber, ethers } from "ethers";

import { assistantFactoryAbi, counterstakeFactoryAbi } from "abi";
import { nativeSymbols } from "nativeSymbols";
import { getFactoryContractAddressByNetwork } from "pages/Create/utils/createBridgeOnEVM";
import { evmAssistantFactories } from "pages/Create/utils/createPooledAssistantOnEVM";
import { getParameterList } from "pages/Governance/utils/getParameterList";
import { providers } from "services/evm";
import { fetchCryptocompareExchangeRateCached } from "utils/fetchExchangeRateInUSD";
import { oracleAddresses } from "../ConfigurationStep";

const environment = process.env.REACT_APP_ENVIRONMENT;

export const estimateGasForCreationBridge = async ({ home_network, foreign_network, assistantsWillBeCreated }) => {
  let fullFee = 0;

  if (foreign_network !== "Obyte") {

    const provider = providers[foreign_network];

    const contractAddress = getFactoryContractAddressByNetwork(foreign_network);
    console.log("contractAddress", contractAddress)
    const contract = new ethers.Contract(contractAddress, counterstakeFactoryAbi, provider);
    const oracles = oracleAddresses[foreign_network];

    const challenging_periods = getParameterList(foreign_network).challenging_periods.initValue.map((v) => BigNumber.from(String(Number(v * 3600))));
    const large_challenging_periods = getParameterList(foreign_network).large_challenging_periods.initValue.map((v) => BigNumber.from(String(Number(v * 3600))));
    const estimateGas = await contract.estimateGas.createImport(home_network, "0x9ACECb31B2511d9ED421d50F55a7cFCACb04D885", "foreign_description", "ESTIMATE", ethers.constants.AddressZero, oracles, 150, 100, "10000000000000000000", challenging_periods, large_challenging_periods);

    const gasPrice = await provider.getGasPrice();
    const currentNativeSymbol = nativeSymbols[foreign_network];
    const nativePriceInUSD = await fetchCryptocompareExchangeRateCached(currentNativeSymbol, "USD");
    const gasPriceInUSD = gasPrice.toNumber() * nativePriceInUSD;

    fullFee = (estimateGas.toNumber() / 1e18) * gasPriceInUSD;
  }


  if (home_network !== "Obyte") {
    const provider = providers[home_network];
    const contractAddress = getFactoryContractAddressByNetwork(home_network);

    const contract = new ethers.Contract(contractAddress, counterstakeFactoryAbi, provider);

    const challenging_periods = getParameterList(home_network).challenging_periods.initValue.map((v) => BigNumber.from(String(Number(v * 3600))));
    const large_challenging_periods = getParameterList(home_network).large_challenging_periods.initValue.map((v) => BigNumber.from(String(Number(v * 3600))));

    const estimateGas = await contract.estimateGas.createExport(foreign_network, "oMdNe66UXHhPWMCzzFQZD1edTmgXJpMRAb5GfPwW+b4=", "0x9ACECb31B2511d9ED421d50F55a7cFCACb04D885", 150, 100, "10000000000000000000", challenging_periods, large_challenging_periods);

    const gasPrice = await provider.getGasPrice();
    const currentNativeSymbol = nativeSymbols[home_network];
    const nativePriceInUSD = await fetchCryptocompareExchangeRateCached(currentNativeSymbol, "USD");
    const gasPriceInUSD = gasPrice.toNumber() * nativePriceInUSD;

    fullFee = fullFee + (estimateGas.toNumber() / 1e18) * gasPriceInUSD;
  }

  if (assistantsWillBeCreated) {
    fullFee = fullFee + await estimateGasForCreationAssistant(home_network, "import");
    fullFee = fullFee + await estimateGasForCreationAssistant(foreign_network, "export");
  }

  return Number(fullFee).toFixed(2)
}

export const estimateGasForCreationAssistant = async (network, type) => { // type: import or export
  if (network === "Obyte") return 0;

  const management_fee10000 = "10000";
  const success_fee10000 = "10000";
  const swap_fee10000 = "10000";

  const provider = providers[network];
  const contractAddress = evmAssistantFactories[network];
  const gasPrice = await provider.getGasPrice();

  if (contractAddress) {
    const contract = new ethers.Contract(contractAddress, assistantFactoryAbi, provider);
    const currentNativeSymbol = nativeSymbols[network];
    const nativePriceInUSD = await fetchCryptocompareExchangeRateCached(currentNativeSymbol, "USD");
    const gasPriceInUSD = gasPrice.toNumber() * nativePriceInUSD;

    let estimateGas;

    if (type === "import") {
      let fakeСontractAddress;
      if (network === "Ethereum") {
        fakeСontractAddress = environment === "testnet" ? "0x8BC553A65B0027638fca511D7DA67c86AF3aec50" : "0xf7742caF6Dae87AE6D6fbE70F8aD002a3f1952b9";
      } else if (network === "BSC") {
        fakeСontractAddress = environment === "testnet" ? "0x9F60328982ab3e34020A9D43763db43d03Add7CF" : "0x0aD0Cce772ffcF8f9e70031cC8c1b7c20af5212F";
      } else if (network === "Polygon") {
        fakeСontractAddress = environment === "testnet" ? "0xeA9E7c046c6E4635F9A71836fF023c8f45948433" : "0xAB5F7a0e20b0d056Aed4Aa4528C78da45BE7308b";
      }

      estimateGas = await contract.estimateGas.createImportAssistant(fakeСontractAddress, "0xC03fA3cf434A0f8Ce7152Ff432d678e403Eaab11", management_fee10000, success_fee10000, swap_fee10000, 1, "desc", "SYMBOL");
    } else if (type === "export") {

      let fakeСontractAddress;
      if (network === "Ethereum") {
        fakeСontractAddress = environment === "testnet" ? "0xA065E75f0aE60Ed3EE82e1d82D28aAE8d82af990" : "0x3BE8A7D4Aa3E9b723a718E1B83fE8a8B5C37871C";
      } else if (network === "BSC") {
        fakeСontractAddress = environment === "testnet" ? "0x5eA4395f667B613F6695f487d52c87CB298e4837" : "0xa5893a1A1FF15031d8AB5aC24531D3B3418612EE";
      } else if (network === "Polygon") {
        fakeСontractAddress = environment === "testnet" ? "0x5e31fcc4EC6D042B0c1C779Fe7e6273c10D16bE9" : "0xCF2b29769dec9b9210fE77163B0AE7D87F7FB612";
      }

      estimateGas = await contract.estimateGas.createExportAssistant(fakeСontractAddress, "0xC03fA3cf434A0f8Ce7152Ff432d678e403Eaab11", management_fee10000, success_fee10000, 1, "desc", "SYMBOL");
    }

    return gasPriceInUSD * (estimateGas.toNumber() / 1e18);

  } else {
    throw Error("unknown network")
  }
}