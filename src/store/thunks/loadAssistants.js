
import { createAsyncThunk } from "@reduxjs/toolkit";
import { exportAssistantAbi, importAssistantAbi } from "abi";
import { BigNumber, ethers } from "ethers";
import { groupBy, isArray } from "lodash";

import { getPooledAssistants } from "services/api";
import { providers } from "services/evm";
import obyte from "services/socket";
import { getDecimals, getSymbol } from "utils";
import { fetchExchangeRateInUSD } from "utils/fetchExchangeRateInUSD";
import { getAaBalances } from "utils/getAaBalances";
import { getBalance } from "utils/getBalance";
import config from "appConfig";
import { getMultiCallAddress } from "utils/getMulticallAddress";

const forward_factory = config.IMPORT_FORWARD_FACTORY;

if (!forward_factory) {
  console.error("env 'REACT_APP_IMPORT_FORWARD_FACTORY' not found")
}

const multicallAbi = [
  {
    "constant": true,
    "inputs": [
      {
        "components": [
          {
            "name": "target",
            "type": "address"
          },
          {
            "name": "callData",
            "type": "bytes"
          }
        ],
        "name": "calls",
        "type": "tuple[]"
      }
    ],
    "name": "aggregate",
    "outputs": [
      {
        "name": "blockNumber",
        "type": "uint256"
      },
      {
        "name": "returnData",
        "type": "bytes[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];


export const loadAssistants = createAsyncThunk(
  'get/loadAssistants',
  async (_, { getState }) => {
    const { directions, destAddress } = getState();
    let forwardAAs;

    let assistantsList = await getPooledAssistants();
    const shares_symbols = [];

    assistantsList?.data.forEach(({ shares_symbol }) => shares_symbol && shares_symbols.push(shares_symbol));
    assistantsList = assistantsList?.data.filter(({ network, version }) => (network === "Obyte" || version !== "v1"));

    if (config.IMPORT_FORWARD_FACTORY) {
      forwardAAs = await obyte.api.getAaStateVars({ address: config.IMPORT_FORWARD_FACTORY });
      await obyte.justsaying("light/new_aa_to_watch", {
        aa: config.IMPORT_FORWARD_FACTORY
      });
    }

    let balanceOfMyObyteWallet;

    if (destAddress.Obyte) {
      balanceOfMyObyteWallet = await obyte.api.getBalances([destAddress.Obyte]).then((b) => b?.[destAddress.Obyte]);
    }

    const shareDecimalsGetters = [];
    const newWatches = [];
    const forwards = [];

    const homeTokens = {
      [ethers.constants.AddressZero]: "EVM native token"
    };

    const managers = [];

    assistantsList.forEach((a) => {
      a.stake_asset = a.side === 'import' ? directions[a.bridge_aa]?.stake_asset : directions[a.bridge_aa]?.src_token.asset;
      a.stake_asset_symbol = a.side === 'import' ? null : directions[a.bridge_aa]?.src_token.symbol;
      a.stake_asset_decimals = a.side === 'import' ? null : directions[a.bridge_aa]?.src_token.decimals;
      a.image_asset = a.side === 'import' ? directions[a.bridge_aa]?.src_token.asset : undefined;
      a.image_asset_symbol = a.side === 'import' ? directions[a.bridge_aa]?.src_token.symbol : undefined;
      a.image_asset_decimals = a.side === 'import' ? directions[a.bridge_aa]?.src_token.decimals : undefined;
      a.home_asset = directions[a.bridge_aa]?.home_asset;
      a.home_network = directions[a.bridge_aa]?.home_network;
      a.home_symbol = directions[a.bridge_aa]?.home_symbol;


      if (!managers.includes(a.manager)) {
        managers.push(a.manager)
      }

      if (!(a.home_asset in homeTokens)) {
        homeTokens[a.home_asset] = `${a.home_symbol} from ${a.home_network}`;
      }

      if (a.network === "Obyte") {
        shareDecimalsGetters.push(getDecimals(a.shares_asset, "Obyte").then((decimals) => a.shares_decimals = decimals))
        newWatches.push(obyte.justsaying("light/new_aa_to_watch", { aa: a.assistant_aa }))
      }

      if (a.network === "Obyte" && a.side === "import") {
        a.forward = forwardAAs[`forward_aa_${a.assistant_aa}`]

        if (a.forward) {
          newWatches.push(obyte.justsaying("light/new_aa_to_watch", { aa: a.forward }))
          forwards.push(a.forward)
        }
      }
    });

    // get list obyte assistants
    const obyteAssistants = assistantsList.filter(a => a.network === "Obyte").map((a) => a.assistant_aa);


    // get list evm assistants
    const evm_contracts = assistantsList.filter(a => a.network !== "Obyte");

    // get assistants state vars
    const obyteAssistantsStateVars = {};
    const obyteAssistantsStateVarsGetters = obyteAssistants.map(address => obyte.api.getAaStateVars({ address }).then(state => obyteAssistantsStateVars[address] = state));

    // get assistants params
    const obyteAssistantsParams = {};
    const obyteAssistantsParamsGetters = obyteAssistants.map(address => obyte.api.getDefinition(address).then(definition => obyteAssistantsParams[address] = definition[1].params));



    // get evm assistants info
    const evmAssistantInfo = {};
    const nodeRealEthereumProvider = config.NODEREAL_PROJECT_ID ? new ethers.providers.JsonRpcProvider(`https://eth-mainnet.nodereal.io/v1/${config.NODEREAL_PROJECT_ID}`) : null;

    const infoEVMGetters = evm_contracts.map(({ assistant_aa, network, side, stake_asset, image_asset, shares_asset, home_network, home_asset }) => {
      const multiCallContract = new ethers.Contract(getMultiCallAddress(network), multicallAbi, network === "Ethereum" ? nodeRealEthereumProvider || providers[network] : providers[network]);
      const contractInterface = new ethers.utils.Interface(side === "import" ? importAssistantAbi : exportAssistantAbi);

      const calls = [
        {
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("mf")
        },
        {
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("ts")
        },
        {
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("success_fee10000")
        },
        {
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("management_fee10000")
        },
        {
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("profit")
        },
        {
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("balance_in_work")
        },
        {
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("exponent")
        },
        {
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("totalSupply")
        },
      ];

      if (side === "import") {
        calls.push({
          target: assistant_aa,
          callData: contractInterface.encodeFunctionData("swap_fee10000") // only for import side
        })
      }

      const evmAssistantDataGetter = multiCallContract.aggregate(calls).then(({ returnData }) => {
        const data = returnData.map((data, index) => {
          const functionFragment = contractInterface.getFunction(calls[index].callData.slice(0, 10));
          return contractInterface.decodeFunctionResult(functionFragment, data);
        })

        const res = data.map(([value]) => {
          return isArray(value) ? [BigNumber.from(value[0]).toString(), BigNumber.from(value[1]).toString()] : BigNumber.from(typeof value !== "number" ? value : String(value)).toString();
        });
        return res;
      });

      return Promise.all([
        evmAssistantDataGetter,
        getBalance(assistant_aa, stake_asset, network),
        side === "import" ? getBalance(assistant_aa, image_asset, network) : null,
        destAddress?.[network] ? getBalance(destAddress?.[network], shares_asset, network) : "0",
        fetchExchangeRateInUSD(network, stake_asset, true),
        side === "import" ? fetchExchangeRateInUSD(home_network, home_asset, true) : null
      ]).then(([data, ...rest]) => evmAssistantInfo[assistant_aa] = [...data, ...rest]);
    })

    const stakeRates = {}
    const stakeRatesGetters = assistantsList.map((a) => fetchExchangeRateInUSD(a.network, a.stake_asset, true).then(rate => stakeRates[a.assistant_aa] = rate));

    const imageRates = {}
    const ImageRatesGetters = assistantsList.map((a) => fetchExchangeRateInUSD(a.home_network, a.home_asset, true).then(rate => imageRates[a.assistant_aa] = rate));

    let obyteAssistantsBalances = {}
    const obyteAssistantsBalancesGetter = obyteAssistants.map((address) => getAaBalances(address).then(balances => obyteAssistantsBalances[address] = balances));

    await Promise.all([obyteAssistantsBalancesGetter, ...infoEVMGetters, ...obyteAssistantsParamsGetters, ...obyteAssistantsStateVarsGetters, ...shareDecimalsGetters, ...newWatches, ...stakeRatesGetters, ...ImageRatesGetters]);

    assistantsList.forEach(async (a) => {
      
      if (a.network === "Obyte") {
        // cache
        a.cacheBalance = obyteAssistantsBalances[a.assistant_aa];
        a.cacheState = obyteAssistantsStateVars[a.assistant_aa];
        a.cacheParams = obyteAssistantsParams[a.assistant_aa];

        a.management_fee = obyteAssistantsStateVars[a.assistant_aa]?.management_fee || obyteAssistantsParams[a.assistant_aa]?.management_fee;
        a.success_fee = obyteAssistantsStateVars[a.assistant_aa]?.success_fee || obyteAssistantsParams[a.assistant_aa]?.success_fee;

        a.shares_supply = obyteAssistantsStateVars[a.assistant_aa]?.shares_supply || 0;
        a.exponent = a.cacheParams?.exponent || 1;

        a.stake_balance = a.cacheBalance?.[a.stake_asset] || 0;
        a.image_balance = a.cacheBalance?.[a.image_asset] || 0;

        a.stakeRateInUSD = stakeRates[a.assistant_aa];

        if (a.side === "import") {

          a.swap_fee = a.cacheState.swap_fee || a.cacheParams.swap_fee || 0.003;
          // mf
          a.stake_mf = a.cacheState.mf.stake;
          a.image_mf = a.cacheState.mf.image;
          // ts
          a.ts = a.cacheState.mf.ts;
          // sf
          a.stake_sf = Math.max(Math.floor(a.cacheState.stake_profit * a.cacheParams.success_fee), 0);
          a.image_sf = Math.max(Math.floor(a.cacheState.image_profit * a.cacheParams.success_fee), 0);
          // balances in work
          a.stake_balance_in_work = a.cacheState.stake_balance_in_work;
          a.image_balance_in_work = a.cacheState.image_balance_in_work;
          // profit
          a.stake_profit = a.cacheState.stake_profit;
          a.image_profit = a.cacheState.image_profit;

          a.stake_share = a.cacheParams.stake_share || 0.5;
          a.image_share = 1 - a.stake_share;
          a.imageRateInUSD = imageRates[a.assistant_aa]//await fetchExchangeRateInUSD(a.home_network, a.home_asset, true);
        } else {
          // mf
          a.stake_mf = a.cacheState.mf;
          // ts
          a.ts = a.cacheState.ts;
          // sf
          a.stake_sf = Math.max(Math.floor(a.cacheState.profit * a.cacheParams.success_fee), 0);
          // balance in work
          a.stake_balance_in_work = a.cacheState.balance_in_work;
          // profit
          a.stake_profit = a.cacheState.profit;
        }

      } else {
        a.shares_decimals = 18;
        let mf, ts, success_fee, management_fee, profit, balance_in_work, exponent, shares_supply, swap_fee, stake_balance, image_balance, my_balance_of_shares, stakeRateInUSD, imageRateInUSD;

        if (a.side === "import") {
          [mf, ts, success_fee, management_fee, profit, balance_in_work, exponent, shares_supply, swap_fee, stake_balance, image_balance, my_balance_of_shares, stakeRateInUSD, imageRateInUSD] = evmAssistantInfo[a.assistant_aa];
        } else {
          [mf, ts, success_fee, management_fee, profit, balance_in_work, exponent, shares_supply, stake_balance, image_balance, my_balance_of_shares, stakeRateInUSD, imageRateInUSD] = evmAssistantInfo[a.assistant_aa];
        }

        a.ts = ts;
        a.stake_balance = stake_balance;
        a.image_balance = image_balance;
        a.success_fee = success_fee;
        a.management_fee = management_fee;
        a.shares_supply = shares_supply;
        a.exponent = exponent;
        a.my_balance_of_shares = my_balance_of_shares;
        a.stakeRateInUSD = stakeRateInUSD;

        if (a.side === "import") {
          a.stake_balance_in_work = balance_in_work[0];
          a.image_balance_in_work = balance_in_work[1];

          a.stake_mf = mf[0];
          a.image_mf = mf[1];

          a.stake_profit = profit[0];
          a.image_profit = profit[1];

          a.swap_fee = swap_fee;

          a.imageRateInUSD = imageRateInUSD;
        } else {
          a.stake_mf = mf;
          a.stake_balance_in_work = balance_in_work;
          a.stake_profit = profit;
        }
      }
    })

    //  get stake decimals and symbol
    const stakeAssetAndDecimalsGetters = [];
    assistantsList.forEach((a) => {
      if (a.side === "import" && a.stake_asset_symbol === null && a.stake_asset_decimals === null) {
        stakeAssetAndDecimalsGetters.push(Promise.all([
          getSymbol(a.stake_asset, a.network),
          getDecimals(a.stake_asset, a.network)
        ]).then(([symbol, decimals]) => {
          a.stake_asset_symbol = symbol;
          a.stake_asset_decimals = decimals;
        }))
      }
    })

    await Promise.all(stakeAssetAndDecimalsGetters);

    const assistants = groupBy(assistantsList, "bridge_aa");

    return {
      assistants,
      obyteAssistants,
      forwards,
      balanceOfMyObyteWallet,
      managers,
      homeTokens,
      shares_symbols
    }
  })