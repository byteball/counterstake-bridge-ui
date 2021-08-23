import { isArray } from "lodash";
import { message } from "antd";
import { BigNumber, ethers } from "ethers";

import { chainIds } from "chainIds";
import { counterstakeAbi, votedValueAddressAbi, votedValueUintAbi, votedValueUintArrayAbi, governanceAbi } from "abi";
import { providers } from "services/evm";
import { getParameterList } from "./getParameterList";
import { changeNetwork } from "utils/changeNetwork";

const environment = process.env.REACT_APP_ENVIRONMENT;

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
      transformedValue = ethers.utils.parseUnits(Number(newValue).toFixed(this.stake_asset_decimals), this.stake_asset_decimals).toString();
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

  async getParam(name) {
    if (['ratio', 'counterstake_coef', 'min_tx_age'].includes(name)) {
      const settings = await this.bridge_contract.settings();
      if (name === 'ratio') return settings.ratio100;
      if (name === 'counterstake_coef') return settings.counterstake_coef100;
      if (name === 'min_tx_age') return settings.min_tx_age
    } else if (name === 'oracles') {
      return await this.bridge_contract.oracleAddress();
    } else if (name === 'min_price') {
      const min_priceBn = await this.bridge_contract.min_price20();
      return min_priceBn && BigNumber.from(min_priceBn).toString()
    } else if (name === 'challenging_periods') {
      return await this.getChallengingPeriods(false)
    } else if (name === 'large_challenging_periods') {
      return await this.getChallengingPeriods(true)
    } else {
      throw new Error("Unknown parameter")
    }
  }

  async getAllParams(type) {
    const [
      settings,
      challenging_periods,
      large_challenging_periods
    ] = await Promise.all([
      this.bridge_contract.settings(),
      this.getChallengingPeriods(false),
      this.getChallengingPeriods(true)
    ])

    const result = {
      ratio: { value: settings.ratio100 },
      counterstake_coef: { value: settings.counterstake_coef100 },
      min_tx_age: { value: settings.min_tx_age },
      min_stake: { value: settings.min_stake ? BigNumber.from(settings.min_stake).toString() : undefined },
      large_threshold: { value: settings.large_threshold ? BigNumber.from(settings.large_threshold).toString() : undefined },
      challenging_periods: { value: challenging_periods },
      large_challenging_periods: { value: large_challenging_periods }
    };

    if (type === "import") {
      const min_priceBn = await this.bridge_contract.min_price20();
      result.min_price = { value: min_priceBn ? +ethers.utils.formatUnits(BigNumber.from(min_priceBn), 20).toString() : undefined }
      result.oracles = { value: await this.bridge_contract.oracleAddress() }
    }
    return result
  }

  async getChallengingPeriods(is_large) {
    let lastPeriod;
    const periodsList = [];

    for (var i = 0; i < 9; i++) {
      if (lastPeriod !== undefined) {
        const period = await this.bridge_contract.getChallengingPeriod(BigNumber.from(i), is_large).then((value) => BigNumber.from(value).toString());
        if (period !== undefined && Number(period) > lastPeriod) {
          lastPeriod = Number(period);
          periodsList.push(Number(period));
        } else {
          break;
        }
      } else {
        const period = await this.bridge_contract.getChallengingPeriod(BigNumber.from(i), is_large).then((value) => BigNumber.from(value).toString());
        lastPeriod = Number(period);
        periodsList.push(Number(period));
      }
    }

    return periodsList;
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

  async getLeadersAndChoices(type) {
    const contract = await this.getGovernanceContract(false);
    const keys = type === "import" ? Object.keys(this.parameterList) : Object.keys(this.parameterList).filter((p) => !this.parameterList[p].importOnly);


    const getInfo = keys.map((key) => contract.votedValuesMap(this.parameterList[key].evm_name || this.parameterList[key].name).then(async (address) => {
      const voteContract = this.getContractByType(address, this.parameterList[key].type, false);

      if (key === "ratio" || key === "min_tx_age" || key === "counterstake_coef" || key === "large_threshold" || key === "min_stake" || key === "min_price") {
        const [leader, your_choice] = await Promise.all([
          voteContract.leader(),
          this.wallet ? voteContract.choices(this.wallet) : undefined,
        ]);

        const [
          support_leader,
          support_choices,
          challenging_period_start_ts
        ] = await Promise.all([
          voteContract.votesByValue(leader),
          your_choice ? voteContract.votesByValue(your_choice) : undefined,
          voteContract.challenging_period_start_ts()
        ]);

        return { name: key, address, leader: BigNumber.from(leader).toString(), your_choice: your_choice ? !your_choice.isZero() && BigNumber.from(your_choice).toString() : undefined, support_leader: support_leader ? !support_leader.isZero() && BigNumber.from(support_leader).toString() : undefined, support_choices: support_choices ? BigNumber.from(support_choices).toString() : undefined, challenging_period_start_ts: BigNumber.from(challenging_period_start_ts).toNumber() }
      } else if (key === "challenging_periods" || key === "large_challenging_periods") {
        let lastPeriodLeader = null;
        const periodsListLeader = [];

        for (let i = 0; i < 20; i++) {
          try {
            if (lastPeriodLeader !== null) {
              const period = await voteContract.leader(i).then((value) => BigNumber.from(String(value)).toNumber());
              if (period !== undefined && Number(period) > lastPeriodLeader) {
                lastPeriodLeader = Number(period);
                periodsListLeader.push(Number(period));
              } else {
                break;
              }
            } else {
              const period = await voteContract.leader(i).then((value) => BigNumber.from(String(value)).toNumber());
              lastPeriodLeader = Number(period);
              periodsListLeader.push(Number(period));
            }
          } catch {
            break;
          }
        }


        let lastPeriodChoice = null;
        const periodsListChoice = [];
        if (this.wallet) {
          for (let i = 0; i < 20; i++) {
            try {
              if (lastPeriodChoice !== null) {
                const period = await voteContract.choices(this.wallet, i).then((value) => BigNumber.from(value).toNumber());
                if (period !== undefined && Number(period) > lastPeriodChoice) {
                  lastPeriodChoice = Number(period);
                  periodsListChoice.push(Number(period));
                } else {
                  break;
                }
              } else {
                const period = await voteContract.choices(this.wallet, i).then((value) => BigNumber.from(value).toNumber());
                lastPeriodChoice = period;
                periodsListChoice.push(period);
              }
            } catch {
              break;
            }
          }
        }


        let support_leader;
        if (periodsListLeader.length > 0) {
          try {
            const leaderBn = periodsListLeader.map(v => BigNumber.from(String(v)));
            const leaderKey = await voteContract.getKey(leaderBn)
            support_leader = await voteContract.votesByValue(leaderKey);
          } catch (e) { }
        }

        let support_choices;
        if (this.wallet && periodsListChoice.length > 0) {
          try {
            const choicesBn = periodsListChoice.map(v => BigNumber.from(String(v)));
            const choicesKey = await voteContract.getKey(choicesBn)
            support_choices = await voteContract.votesByValue(choicesKey);
          } catch { }
        }

        const challenging_period_start_ts = await voteContract.challenging_period_start_ts();

        return {
          name: key,
          address,
          leader: periodsListLeader.length > 0 && periodsListLeader,
          your_choice: periodsListChoice.length > 0 && periodsListChoice,
          support_leader: periodsListLeader.length > 0 && BigNumber.from(support_leader).toString(),
          support_choices: periodsListChoice.length > 0 && BigNumber.from(support_choices).toString(),
          challenging_period_start_ts: challenging_period_start_ts ? BigNumber.from(challenging_period_start_ts).toNumber() : undefined
        }

      } else if (key === "oracles") {
        const [leader, your_choice] = await Promise.all([
          voteContract.leader(),
          this.wallet ? voteContract.choices(this.wallet) : undefined,
        ]);

        const [
          support_leader,
          support_choices,
          challenging_period_start_ts
        ] = await Promise.all([
          voteContract.votesByValue(leader),
          your_choice ? voteContract.votesByValue(your_choice) : undefined,
          voteContract.challenging_period_start_ts()
        ]);

        return {
          name: key,
          address,
          leader: leader !== ethers.constants.AddressZero && leader,
          your_choice: your_choice !== ethers.constants.AddressZero && your_choice,
          support_leader: BigNumber.from(support_leader).toString(),
          support_choices: your_choice && support_choices ? BigNumber.from(support_choices).toString() : undefined,
          challenging_period_start_ts: challenging_period_start_ts ? BigNumber.from(challenging_period_start_ts).toNumber() : undefined
        }
      }
    }));

    const leadersAndChoices = await Promise.all(getInfo);

    return leadersAndChoices;
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
    const getInitValues = this.getAllParams(type);
    const getOtherInfo = this.getLeadersAndChoices(type);

    const [initValues, otherInfo] = await Promise.all([getInitValues, getOtherInfo]);

    const otherInfoObj = {};
    otherInfo.forEach(({ name, ...other }) => otherInfoObj[name] = other);

    const initState = {};
    Object.keys(initValues).forEach((name) => {
      initState[name] = {
        value: initValues[name]?.value,
        leader: otherInfoObj[name]?.leader,
        challenging_period_start_ts: otherInfoObj[name]?.challenging_period_start_ts || undefined,
        contract_address: otherInfoObj[name]?.address,
        supports: {},
        choices: {}
      }

      if (otherInfoObj[name].support_choices !== 0 && otherInfoObj[name]?.your_choice) {
        initState[name].choices[this.wallet] = otherInfoObj[name]?.your_choice;
        const keyChoice = isArray(otherInfoObj[name]?.your_choice) ? otherInfoObj[name]?.your_choice.map(v => v / 3600).join(" ") : otherInfoObj[name]?.your_choice;
        initState[name].supports[keyChoice] = [
          {
            support: otherInfoObj[name].support_choices
          }
        ];
      }

      if (otherInfoObj[name].support_leader !== false && otherInfoObj[name].support_leader !== "0" && otherInfoObj[name]?.leader) {
        const keyLeader = isArray(otherInfoObj[name]?.leader) ? otherInfoObj[name]?.leader.map(v => v / 3600).join(" ") : otherInfoObj[name]?.leader;
        if (!(keyLeader in initState[name].supports)) {
          initState[name].supports[keyLeader] = [
            {
              support: otherInfoObj[name].support_leader
            }
          ];
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