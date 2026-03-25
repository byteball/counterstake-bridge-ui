import { isArray } from "lodash";
import { message } from "antd";
import { BigNumber, ethers } from "ethers";

import { chainIds } from "chainIds";
import { counterstakeAbi, votedValueAddressAbi, votedValueUintAbi, votedValueUintArrayAbi, governanceAbi, multicallAbi } from "abi";
import { providers } from "services/evm";
import { getParameterList } from "./getParameterList";
import { getMultiCallAddress } from "utils/getMulticallAddress";
import { changeNetwork } from "utils/changeNetwork";
import config from "appConfig";

const environment = config.ENVIRONMENT;

const bridgeIface = new ethers.utils.Interface(counterstakeAbi);
const govIface = new ethers.utils.Interface(governanceAbi);
const uintIface = new ethers.utils.Interface(votedValueUintAbi);
const arrayIface = new ethers.utils.Interface(votedValueUintArrayAbi);
const addressIface = new ethers.utils.Interface(votedValueAddressAbi);

const getIfaceByType = (type) => type === 'uint' ? uintIface : type === 'address' ? addressIface : arrayIface;

const isValidEVMAddress = (address) => ethers.utils.getAddress(address) === address;

const MAX_UINT256 = ethers.BigNumber.from(2).pow(256).sub(1);

const erc20Abi = [
  "function allowance(address owner, address spender) public view virtual override returns (uint256)",
  "function approve(address spender, uint256 amount) public virtual override returns (bool)",
  "function balanceOf(address account) public view virtual override returns (uint256)",
];

export class EVMBridgeGovernance {
  constructor(network, bridge_contract_address, decimals, wallet, stake_asset_decimals) {
    if (!network || !(network === "Obyte" || (network in chainIds[environment]))) throw new Error('Not valid network');
    this.network = network;
    this.provider = providers[network];

    this.wallet = wallet;

    if (decimals === undefined) throw new Error('Not valid decimals');
    this.decimals = decimals;

    this.stake_asset_decimals = stake_asset_decimals;

    if (!bridge_contract_address || !isValidEVMAddress(bridge_contract_address)) throw new Error('bridge_contract_address not valid');
    this.bridge_contract = new ethers.Contract(bridge_contract_address, counterstakeAbi, this.provider);
    this.bridge_contract_address = bridge_contract_address;

    this.parameterList = getParameterList(network);
  }

  async getGovernanceContractAddress() {
    if (this.governance_contract_address) return this.governance_contract_address;

    const governance_contract_address = await this.bridge_contract.governance();

    this.governance_contract_address = governance_contract_address;

    return governance_contract_address;
  }

  async getGovernanceContract(isSigner) {
    if (!this.governance_contract_address) {
      this.governance_contract_address = await this.getGovernanceContractAddress();
    }

    const signer = isSigner && this.getSigner();

    const governance_contract = new ethers.Contract(this.governance_contract_address, governanceAbi, signer || this.provider);

    return governance_contract;
  }

  async changeParam(name, newValue, amount, cb) {
    if (!(name in this.parameterList)) throw new Error("unknown param");

    await this.login();
    await this.changeNetwork();

    const isActualWallet = await this.isActualWallet();
    if (!isActualWallet) return;

    const votingTokenAddress = await this.getVotingTokenAddress();
    const governance_contract = await this.getGovernanceContract();

    let transformedValue;
    if (['ratio', 'counterstake_coef'].includes(name)) {
      transformedValue = +Number(Number(newValue) * 100).toFixed(3)
    } else if (name === "min_price") {
      transformedValue = ethers.utils.parseUnits(newValue, 20).toString();
    } else if (['challenging_periods', 'large_challenging_periods'].includes(name)) {
      transformedValue = String(newValue).split(" ").map((v) => BigNumber.from(String(Number(v * 3600))));
    } else if (name === "min_stake" || name === "large_threshold") {
      transformedValue = ethers.utils.parseUnits(newValue, this.stake_asset_decimals).toString();
    } else {
      transformedValue = newValue;
    }

    const bnAmount = amount && ethers.utils.parseUnits(Number(amount).toFixed(this.decimals), this.decimals);
    const options = votingTokenAddress === ethers.constants.AddressZero ? { value: bnAmount } : undefined;

    let res;
    if (name === "ratio" || name === "counterstake_coef" || name === "min_stake" || name === "large_threshold" || name === "min_price" || name === "min_tx_age") {
      const param_contract_address = await governance_contract.votedValuesMap(name + ((name === "ratio" || name === "counterstake_coef" || name === "min_price") ? (name === "min_price" ? "20" : "100") : ""));
      const param_contract = this.getContractByType(param_contract_address, 'uint', true);
      const bnNewValue = BigNumber.from(String(transformedValue));

      if (!amount) {
        res = await param_contract.vote(bnNewValue)
      } else {
        await this.approve(bnAmount);
        if (options) {
          res = await param_contract.voteAndDeposit(bnNewValue, bnAmount, options)
        } else {
          res = await param_contract.voteAndDeposit(bnNewValue, bnAmount)
        }
      }

    } else if (['challenging_periods', 'large_challenging_periods'].includes(name)) {
      const param_contract_address = await governance_contract.votedValuesMap(name);
      const param_contract = this.getContractByType(param_contract_address, 'unitArray', true);

      if (!amount) {
        res = await param_contract.vote(transformedValue)
      } else {
        await this.approve(bnAmount);
        if (options) {
          res = await param_contract.voteAndDeposit(transformedValue, bnAmount, options)
        } else {
          res = await param_contract.voteAndDeposit(transformedValue, bnAmount)
        }
      }
    } else if (name === "oracles") {
      try {
        const param_contract_address = await governance_contract.votedValuesMap('oracleAddress');
        const param_contract = this.getContractByType(param_contract_address, 'address', true);

        if (!amount) {
          res = await param_contract.vote(transformedValue);
        } else {
          await this.approve(bnAmount);
          if (options) {
            res = await param_contract.voteAndDeposit(transformedValue, bnAmount, options);
          } else {
            res = await param_contract.voteAndDeposit(transformedValue, bnAmount);
          }
        }


      } catch ({ error, code }) {
        message.error(error.message);
        throw error.message;
      }
    }

    await res?.wait();

    cb && await cb(name, newValue, amount, this.wallet)
  }

  async remove(name, contract_address, cb) {
    await this.login();
    await this.changeNetwork();

    const isActualWallet = await this.isActualWallet();
    if (!isActualWallet) return;

    const param_contract = this.getContractByType(contract_address, this.parameterList[name].type, true);
    const res = await param_contract.unvote();
    await res.wait();

    cb && await cb(name, contract_address);
  }

  async commit(name, contract_address, cb) {
    await this.login();
    await this.changeNetwork();

    const isActualWallet = await this.isActualWallet();
    if (!isActualWallet) return;

    const param_contract = this.getContractByType(contract_address, this.parameterList[name].type, true);
    const res = await param_contract.commit();
    await res.wait();

    cb && await cb(name, contract_address);
  }

  async withdraw(amountBn, cb) {
    await this.login();
    await this.changeNetwork();

    const isActualWallet = await this.isActualWallet();
    if (!isActualWallet) return;

    const governance_contract = await this.getGovernanceContract(true);

    let res;
    if (amountBn) {
      res = await governance_contract['withdraw(uint256)'](amountBn);
    } else {
      res = await governance_contract['withdraw()']();
    }

    await res.wait();

    cb && await cb(amountBn);
  }

  _multicall(calls) {
    const multicallContract = new ethers.Contract(getMultiCallAddress(this.network), multicallAbi, this.provider);
    return multicallContract.callStatic.tryAggregate(false, calls);
  }

  static _parsePeriodsList(results) {
    const list = [];
    for (const period of results) {
      if (period === null) break;
      if (list.length === 0 || period > list[list.length - 1]) {
        list.push(period);
      } else {
        break;
      }
    }
    return list;
  }

  getContractByType(address, type, signer) {
    // type = 'uint' | 'address' | 'unitArray'
    if (!address || !isValidEVMAddress(address)) throw new Error('address not valid');
    if (!['uint', 'address', 'unitArray'].includes(type)) throw new Error(`error vote type: ${type}`)

    let abi;
    if (type === 'uint') {
      abi = votedValueUintAbi;
    } else if (type === 'address') {
      abi = votedValueAddressAbi;
    } else if (type === 'unitArray') {
      abi = votedValueUintArrayAbi;
    }


    if (abi !== undefined) {
      if (signer && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        return new ethers.Contract(address, abi, signer);
      } else {
        return new ethers.Contract(address, abi, this.provider);
      }
    } else {
      throw new Error('abi not found')
    }
  }

  async getVotingTokenAddress() {
    if (this.votingTokenAddress) return this.votingTokenAddress;

    const governance_contract = await this.getGovernanceContract();
    const votingTokenAddress = await governance_contract.votingTokenAddress();

    this.votingTokenAddress = votingTokenAddress;

    return votingTokenAddress;
  }

  async getBalance(address) {
    if (!address || !isValidEVMAddress(address)) throw new Error('address not valid');
    const governance_contract = await this.getGovernanceContract();
    const balanceBn = await governance_contract.balances(address);
    return BigNumber.from(balanceBn).toString();
  }

  async getParamContracts() {
    const governance_contract = await this.getGovernanceContract();

    return await governance_contract.votedValues();
  }

  getSigner() {
    if (window.ethereum) {
      const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      return window.ethereum && provider.getSigner();
    }
  }

  async approve(bnAmount) {
    const votingTokenAddress = await this.getVotingTokenAddress();

    if (votingTokenAddress !== ethers.constants.AddressZero && bnAmount !== undefined) {
      const address = await this.getGovernanceContractAddress();
      const token = await this.getVotingTokenAddress();
      const signer = this.getSigner();
      const sender_address = await signer.getAddress();

      const tokenContract = new ethers.Contract(
        token,
        erc20Abi,
        signer
      );

      const allowance = await tokenContract.allowance(sender_address, address);

      if (allowance.lt(bnAmount)) {
        const approval_res = await tokenContract.approve(
          address,
          MAX_UINT256
        );

        await approval_res.wait();
      }
    }
  }

  async changeNetwork() {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const currentNetwork = await provider.getNetwork();
      const bridgeNetwork = chainIds[environment][this.network];
      if (currentNetwork !== bridgeNetwork) {
        await changeNetwork(this.network);
      }
    }
  }

  async initState(type) {
    const keys = type === "import"
      ? Object.keys(this.parameterList)
      : Object.keys(this.parameterList).filter((p) => !this.parameterList[p].importOnly);

    // === Batch 1: governance address + settings + challenging periods (+ import-only params) ===
    const batch1 = [
      { target: this.bridge_contract_address, callData: bridgeIface.encodeFunctionData("governance") },
      { target: this.bridge_contract_address, callData: bridgeIface.encodeFunctionData("settings") },
    ];
    for (let i = 0; i < 9; i++) {
      batch1.push({ target: this.bridge_contract_address, callData: bridgeIface.encodeFunctionData("getChallengingPeriod", [i, false]) });
    }
    for (let i = 0; i < 9; i++) {
      batch1.push({ target: this.bridge_contract_address, callData: bridgeIface.encodeFunctionData("getChallengingPeriod", [i, true]) });
    }
    if (type === "import") {
      batch1.push({ target: this.bridge_contract_address, callData: ethers.utils.id("min_price20()").slice(0, 10) });
      batch1.push({ target: this.bridge_contract_address, callData: ethers.utils.id("oracleAddress()").slice(0, 10) });
    }

    const results1 = await this._multicall(batch1);

    const governance_address = bridgeIface.decodeFunctionResult("governance", results1[0].returnData)[0];
    this.governance_contract_address = governance_address;

    const settings = bridgeIface.decodeFunctionResult("settings", results1[1].returnData);

    const parseBatchPeriods = (results, startIdx) => {
      const raw = [];
      for (let i = 0; i < 9; i++) {
        if (!results[startIdx + i].success) { raw.push(null); continue; }
        raw.push(BigNumber.from(bridgeIface.decodeFunctionResult("getChallengingPeriod", results[startIdx + i].returnData)[0]).toNumber());
      }
      return EVMBridgeGovernance._parsePeriodsList(raw);
    };

    const challenging_periods = parseBatchPeriods(results1, 2);
    const large_challenging_periods = parseBatchPeriods(results1, 11);

    const initValues = {
      ratio: { value: String(settings.ratio100) },
      counterstake_coef: { value: String(settings.counterstake_coef100) },
      min_tx_age: { value: String(settings.min_tx_age) },
      min_stake: { value: settings.min_stake ? BigNumber.from(settings.min_stake).toString() : undefined },
      large_threshold: { value: settings.large_threshold ? BigNumber.from(settings.large_threshold).toString() : undefined },
      challenging_periods: { value: challenging_periods },
      large_challenging_periods: { value: large_challenging_periods }
    };

    if (type === "import") {
      const minPriceResult = results1[20];
      const oracleResult = results1[21];
      if (minPriceResult.success) {
        const min_priceBn = ethers.utils.defaultAbiCoder.decode(['uint256'], minPriceResult.returnData)[0];
        initValues.min_price = { value: min_priceBn ? +ethers.utils.formatUnits(BigNumber.from(min_priceBn), 20).toString() : undefined };
      }
      if (oracleResult.success) {
        initValues.oracles = { value: ethers.utils.defaultAbiCoder.decode(['address'], oracleResult.returnData)[0] };
      }
    }

    // === Batch 2: votedValuesMap addresses for all params ===
    const batch2 = keys.map(key => ({
      target: governance_address,
      callData: govIface.encodeFunctionData("votedValuesMap", [this.parameterList[key].evm_name || this.parameterList[key].name])
    }));

    const results2 = await this._multicall(batch2);

    const voteAddresses = {};
    keys.forEach((key, i) => {
      if (results2[i].success) {
        voteAddresses[key] = govIface.decodeFunctionResult("votedValuesMap", results2[i].returnData)[0];
      }
    });

    // === Batch 3: leader, choice, challenging_period_start_ts for all params ===
    const batch3 = [];
    const batch3Map = [];

    keys.forEach(key => {
      const addr = voteAddresses[key];
      if (!addr) return;
      const paramType = this.parameterList[key].type;
      const iface = getIfaceByType(paramType);

      if (paramType === 'uint' || paramType === 'address') {
        batch3.push({ target: addr, callData: iface.encodeFunctionData("leader") });
        batch3Map.push({ key, field: 'leader' });
        batch3.push({ target: addr, callData: iface.encodeFunctionData("challenging_period_start_ts") });
        batch3Map.push({ key, field: 'ts' });
        if (this.wallet) {
          batch3.push({ target: addr, callData: iface.encodeFunctionData("choices", [this.wallet]) });
          batch3Map.push({ key, field: 'choice' });
        }
      } else if (paramType === 'unitArray') {
        for (let i = 0; i < 20; i++) {
          batch3.push({ target: addr, callData: arrayIface.encodeFunctionData("leader", [i]) });
          batch3Map.push({ key, field: 'leader_arr', index: i });
        }
        batch3.push({ target: addr, callData: arrayIface.encodeFunctionData("challenging_period_start_ts") });
        batch3Map.push({ key, field: 'ts' });
        if (this.wallet) {
          for (let i = 0; i < 20; i++) {
            batch3.push({ target: addr, callData: arrayIface.encodeFunctionData("choices", [this.wallet, i]) });
            batch3Map.push({ key, field: 'choice_arr', index: i });
          }
        }
      }
    });

    const results3 = await this._multicall(batch3);

    const paramData = {};
    keys.forEach(key => { paramData[key] = { leader_arr: [], choice_arr: [] }; });

    results3.forEach((result, i) => {
      const { key, field } = batch3Map[i];
      const paramType = this.parameterList[key].type;
      const iface = getIfaceByType(paramType);

      if (!result.success) {
        if (field === 'leader_arr') paramData[key].leader_arr.push(null);
        if (field === 'choice_arr') paramData[key].choice_arr.push(null);
        return;
      }

      if (field === 'leader') {
        const val = iface.decodeFunctionResult("leader", result.returnData)[0];
        paramData[key].leader = paramType === 'uint' ? BigNumber.from(val) : val;
      } else if (field === 'choice') {
        const val = iface.decodeFunctionResult("choices", result.returnData)[0];
        paramData[key].choice = paramType === 'uint' ? BigNumber.from(val) : val;
      } else if (field === 'ts') {
        paramData[key].challenging_period_start_ts = BigNumber.from(iface.decodeFunctionResult("challenging_period_start_ts", result.returnData)[0]).toNumber();
      } else if (field === 'leader_arr') {
        paramData[key].leader_arr.push(BigNumber.from(arrayIface.decodeFunctionResult("leader", result.returnData)[0]).toNumber());
      } else if (field === 'choice_arr') {
        paramData[key].choice_arr.push(BigNumber.from(arrayIface.decodeFunctionResult("choices", result.returnData)[0]).toNumber());
      }
    });

    // Trim array periods
    keys.forEach(key => {
      if (this.parameterList[key].type === 'unitArray') {
        paramData[key].periodsLeader = EVMBridgeGovernance._parsePeriodsList(paramData[key].leader_arr);
        paramData[key].periodsChoice = EVMBridgeGovernance._parsePeriodsList(paramData[key].choice_arr);
      }
    });

    // === Batch 4: votesByValue for leaders and choices ===
    const batch4 = [];
    const batch4Map = [];

    keys.forEach(key => {
      const addr = voteAddresses[key];
      if (!addr) return;
      const paramType = this.parameterList[key].type;
      const iface = getIfaceByType(paramType);
      const data = paramData[key];
      const currentValue = initValues[key]?.value;

      if (paramType === 'uint') {
        if (data.leader) {
          batch4.push({ target: addr, callData: iface.encodeFunctionData("votesByValue", [data.leader]) });
          batch4Map.push({ key, field: 'support_leader' });
        }
        if (data.choice && !data.choice.isZero()) {
          batch4.push({ target: addr, callData: iface.encodeFunctionData("votesByValue", [data.choice]) });
          batch4Map.push({ key, field: 'support_choice' });
        }
        if (currentValue !== undefined && (!data.leader || !data.leader.eq(BigNumber.from(String(currentValue)))) && (!data.choice || !data.choice.eq(BigNumber.from(String(currentValue))))) {
          batch4.push({ target: addr, callData: iface.encodeFunctionData("votesByValue", [BigNumber.from(String(currentValue))]) });
          batch4Map.push({ key, field: 'support_current' });
        }
      } else if (paramType === 'address') {
        if (data.leader && data.leader !== ethers.constants.AddressZero) {
          batch4.push({ target: addr, callData: iface.encodeFunctionData("votesByValue", [data.leader]) });
          batch4Map.push({ key, field: 'support_leader' });
        }
        if (data.choice && data.choice !== ethers.constants.AddressZero) {
          batch4.push({ target: addr, callData: iface.encodeFunctionData("votesByValue", [data.choice]) });
          batch4Map.push({ key, field: 'support_choice' });
        }
        if (currentValue && currentValue !== ethers.constants.AddressZero && data.leader !== currentValue && data.choice !== currentValue) {
          batch4.push({ target: addr, callData: iface.encodeFunctionData("votesByValue", [currentValue]) });
          batch4Map.push({ key, field: 'support_current' });
        }
      } else if (paramType === 'unitArray') {
        if (data.periodsLeader.length > 0) {
          const leaderKey = ethers.utils.solidityKeccak256(data.periodsLeader.map(() => 'uint256'), data.periodsLeader);
          batch4.push({ target: addr, callData: arrayIface.encodeFunctionData("votesByValue", [leaderKey]) });
          batch4Map.push({ key, field: 'support_leader' });
        }
        if (data.periodsChoice.length > 0) {
          const choiceKey = ethers.utils.solidityKeccak256(data.periodsChoice.map(() => 'uint256'), data.periodsChoice);
          batch4.push({ target: addr, callData: arrayIface.encodeFunctionData("votesByValue", [choiceKey]) });
          batch4Map.push({ key, field: 'support_choice' });
        }
        if (isArray(currentValue) && currentValue.length > 0) {
          const currentKey = ethers.utils.solidityKeccak256(currentValue.map(() => 'uint256'), currentValue);
          const leaderKey = data.periodsLeader.length > 0 ? ethers.utils.solidityKeccak256(data.periodsLeader.map(() => 'uint256'), data.periodsLeader) : null;
          const choiceKey = data.periodsChoice.length > 0 ? ethers.utils.solidityKeccak256(data.periodsChoice.map(() => 'uint256'), data.periodsChoice) : null;
          if (currentKey !== leaderKey && currentKey !== choiceKey) {
            batch4.push({ target: addr, callData: arrayIface.encodeFunctionData("votesByValue", [currentKey]) });
            batch4Map.push({ key, field: 'support_current' });
          }
        }
      }
    });

    if (batch4.length > 0) {
      const results4 = await this._multicall(batch4);
      results4.forEach((result, i) => {
        if (!result.success) return;
        const { key, field } = batch4Map[i];
        const iface = getIfaceByType(this.parameterList[key].type);
        const value = BigNumber.from(iface.decodeFunctionResult("votesByValue", result.returnData)[0]);
        paramData[key][field] = value;
      });
    }

    // === Build final initState ===
    const initState = {};

    Object.keys(initValues).forEach((name) => {
      const data = paramData[name] || {};
      const paramType = this.parameterList[name].type;

      let leader, your_choice, support_leader, support_choices;

      if (paramType === 'uint') {
        leader = data.leader ? data.leader.toString() : undefined;
        your_choice = data.choice && !data.choice.isZero() ? data.choice.toString() : undefined;
        support_leader = data.support_leader && !data.support_leader.isZero() ? data.support_leader.toString() : undefined;
        support_choices = data.support_choice ? data.support_choice.toString() : undefined;
      } else if (paramType === 'address') {
        leader = data.leader && data.leader !== ethers.constants.AddressZero ? data.leader : undefined;
        your_choice = data.choice && data.choice !== ethers.constants.AddressZero ? data.choice : undefined;
        support_leader = data.support_leader ? data.support_leader.toString() : undefined;
        support_choices = data.choice && data.support_choice ? data.support_choice.toString() : undefined;
      } else if (paramType === 'unitArray') {
        leader = data.periodsLeader?.length > 0 ? data.periodsLeader : undefined;
        your_choice = data.periodsChoice?.length > 0 ? data.periodsChoice : undefined;
        support_leader = leader && data.support_leader ? data.support_leader.toString() : undefined;
        support_choices = your_choice && data.support_choice ? data.support_choice.toString() : undefined;
      }

      initState[name] = {
        value: initValues[name]?.value,
        leader,
        challenging_period_start_ts: data.challenging_period_start_ts || undefined,
        contract_address: voteAddresses[name],
        supports: {},
        choices: {}
      };

      if (support_choices && your_choice) {
        initState[name].choices[this.wallet] = your_choice;
        const keyChoice = isArray(your_choice) ? your_choice.join(" ") : your_choice;
        initState[name].supports[keyChoice] = [{ support: support_choices }];
      }

      if (support_leader && support_leader !== "0" && leader) {
        const keyLeader = isArray(leader) ? leader.join(" ") : leader;
        if (!(keyLeader in initState[name].supports)) {
          initState[name].supports[keyLeader] = [{ support: support_leader }];
        }
      }

      const support_current = data.support_current && !data.support_current.isZero() ? data.support_current.toString() : undefined;
      if (support_current) {
        const currentValue = initValues[name]?.value;
        const keyCurrent = isArray(currentValue) ? currentValue.join(" ") : String(currentValue);
        if (!(keyCurrent in initState[name].supports)) {
          initState[name].supports[keyCurrent] = [{ support: support_current }];
        }
      }
    });

    return initState;
  }

  async login() {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    }
  }

  async isActualWallet() {
    const signer = this.getSigner();
    const signerAddress = await signer.getAddress();

    if (this.wallet !== signerAddress) {
      message.warning(`Please select address: ${this.wallet}`)
      return false
    }
    return true
  }
}