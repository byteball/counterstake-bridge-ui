import { Col, Row, Form, Input, Button, Select, AutoComplete } from "antd";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import obyte from "obyte";
import { useDispatch, useSelector } from "react-redux";

import { initialExportParams, initialImportParams } from "../forms/CreateAssistantForm";
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip";
import { getParameterList } from "pages/Governance/utils/getParameterList";
import { chainIds } from "chainIds";
import { configureBridge } from "store/settingsSlice";
import { getOraclePrice } from "utils/getOraclePrice";
import { selectSharesSymbols } from "store/assistantsSlice";
import { selectTokenRegistryState } from "store/tokenRegistrySlice";
import config from "appConfig";
import { nativeSymbols } from "nativeSymbols";

import styles from "../../CreatePage.module.css";

const environment = config.ENVIRONMENT;

const stakeTokens = {
  Obyte: [
    {
      asset: 'base',
      symbol: "GBYTE",
      decimals: 9,
      large_threshold: 1000,
      min_stake: 1
    },
    {
      asset: environment === "testnet" ? "/YZQqJFN71D0Xa7w/WRWhnNwCxQojItoQITl9M9cMME=" : "/YZQqJFN71D0Xa7w/WRWhnNwCxQojItoQITl9M9cMME=",
      symbol: "OUSD",
      decimals: 4,
      large_threshold: 100000,
      min_stake: 20
    }
  ],
  Polygon: [
    {
      asset: ethers.constants.AddressZero,
      symbol: "MATIC",
      large_threshold: 100000,
      decimals: 18
    }
  ],
  BSC: [
    {
      asset: ethers.constants.AddressZero,
      symbol: "BNB",
      large_threshold: 1000,
      decimals: 18
    }
  ],
  Ethereum: [
    {
      asset: ethers.constants.AddressZero,
      symbol: "ETH",
      large_threshold: 100,
      decimals: 18
    }
  ]
}

export const oracleAddresses = environment === "testnet"
  ? {
    Ethereum: '0x1Af68677849da73B62A91d775B6A2bF457c0B2e3',
    BSC: '0x3d2cd866b2e2e4fCE1dCcf662E71ea9611113344',
    Polygon: '0x7A5b663D4Be50E415803176d9f473ee81db590b7',
  }
  : {
    Ethereum: '0xAC4AA997A171A6CbbF5540D08537D5Cb1605E191',
    BSC: '0xdD52899A001a4260CDc43307413A5014642f37A2',
    Polygon: '0xdd603Fc2312A0E7Ab01dE2dA83e7776Af406DCeB',
  };

const oracleList = environment === "testnet" ? [
  "F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N"
] : [
  "JPQKPRI5FMTQRJF4ZZMYZYDQVRD55OTC"
]

const feedNameList = [
  "GBYTE_USD",
  "BTC_USD",
  "ETH_BTC",
  "ETH_USD",
  "ETC_USD",
  "BAT_BTC",
  "BAT_USD",
  "GBYTE_BTC_MA",
  "GBYTE_USD_MA",
  "BNB_USD",
  "BNB_BTC",
  "MATIC_USD",
  "MATIC_BTC",
  "WBTC_USD",
  "USDC_BTC",
  "USDC_USD",
];

const isEmpty = (value) => value === "" || value === undefined;

export const ConfigurationStep = ({ home_network, home_asset, home_decimals, foreign_network, foreign_symbol, home_symbol, assistants_will_be_created }) => {
  const dispatch = useDispatch();

  // component's states
  const [homeAssistantParams, setHomeAssistantParams] = useState({});
  const [foreignAssistantParams, setForeignAssistantParams] = useState({});

  const [homeParams, setHomeParams] = useState({});
  const [foreignParams, setForeignParams] = useState({});

  const [homeManagerAddress, setHomeManagerAddress] = useState({ value: "", valid: false });
  const [foreignManagerAddress, setForeignManagerAddress] = useState({ value: "", valid: false });

  const [oracles, setOracles] = useState({});
  const [oracle, setOracle] = useState({});

  const [checkedOracle, setCheckedOracle] = useState({ valid: undefined, price: undefined });

  const [exportAssistantOracle, setExportAssistantOracle] = useState({ value: "", valid: false });
  const [checkedExportAssistantOracle, setCheckedExportAssistantOracle] = useState({ valid: undefined, price: undefined });

  const [homeAssistantSharesSymbol, setHomeAssistantSharesSymbol] = useState({ value: "", valid: false, isTaken: undefined });
  const [foreignAssistantSharesSymbol, setForeignAssistantSharesSymbol] = useState({ value: "", valid: false, isTaken: undefined });


  // selectors 
  const sharesSymbols = useSelector(selectSharesSymbols);
  const tokenRegistryState = useSelector(selectTokenRegistryState);


  // initial forms
  useEffect(() => {
    const homeAssistantParams = {};
    const foreignAssistantParams = {};

    Object.keys(initialExportParams).map(key => homeAssistantParams[key] = { value: initialExportParams[key] * 100, valid: true });
    Object.keys(initialImportParams).map(key => foreignAssistantParams[key] = { value: initialImportParams[key] * 100, valid: true });

    setHomeAssistantParams(homeAssistantParams);
    setForeignAssistantParams(foreignAssistantParams);

    const homeAssetAsStake = stakeTokens[home_network].find((t) => t.asset === home_asset);
    const homeParams = {
      challenging_periods: {
        value: getParameterList(home_network).challenging_periods.initValue.join(" "),
        valid: true
      },
      large_challenging_periods: {
        value: getParameterList(home_network).large_challenging_periods.initValue.join(" "),
        valid: true
      },
      large_threshold: {
        value: homeAssetAsStake?.large_threshold || "",
        valid: !!homeAssetAsStake
      }
    };

    if (home_network === "Obyte") {
      homeParams.min_stake = {
        value: homeAssetAsStake?.min_stake || "",
        valid: !!homeAssetAsStake
      }

      homeParams.min_tx_age = {
        value: getParameterList(home_network).min_tx_age.initValue,
        valid: true
      }
    }
    setHomeParams(homeParams);
    setForeignParams({
      challenging_periods: {
        value: getParameterList(foreign_network).challenging_periods.initValue.join(" "),
        valid: true
      },
      large_challenging_periods: {
        value: getParameterList(foreign_network).large_challenging_periods.initValue.join(" "),
        valid: true
      },
      large_threshold: {
        value: stakeTokens[foreign_network][0]?.large_threshold || 0,
        valid: true
      },
      min_stake: {
        value: 1,
        valid: true
      },
      min_tx_age: {
        value: getParameterList(foreign_network).min_tx_age.initValue,
        valid: true
      },
      stake_asset: {
        value: stakeTokens[foreign_network][0]?.asset,
        valid: true
      }
    });

    setHomeAssistantSharesSymbol({ value: `${home_symbol}EA`, valid: true })
    setForeignAssistantSharesSymbol({ value: `${foreign_symbol}IA`, valid: true })

    if (foreign_network !== "Obyte") {
      setOracle({ value: oracleAddresses[foreign_network], valid: true })
    }

    if (assistants_will_be_created) {
      setExportAssistantOracle({ value: oracleAddresses[home_network], valid: true })
    }
  }, []);


  // calculate
  const stake_asset_symbol = foreignParams?.stake_asset?.value && stakeTokens[foreign_network]?.find((t) => t.asset === foreignParams?.stake_asset?.value)?.symbol;
  // eslint-disable-next-line
  const assistantParamsIsValid = (!assistants_will_be_created) || (foreignAssistantSharesSymbol.isTaken === false && foreignAssistantSharesSymbol.valid && homeAssistantSharesSymbol.valid && homeAssistantSharesSymbol.isTaken === false && homeManagerAddress.valid && foreignManagerAddress.valid && !Object.entries(homeAssistantParams).find(([_, { valid }]) => !valid)) && !Object.entries(foreignAssistantParams).find(([_, { valid }]) => !valid);
  const bridgesParamsIsValid = !Object.entries(homeParams).find(([_, { valid }]) => !valid) && !Object.entries(foreignParams).find(([_, { valid }]) => !valid) && (foreign_network !== "Obyte" ? oracle.valid && checkedOracle.valid : checkedOracle.valid);
  const assistantOracleValid = !assistants_will_be_created || home_network === "Obyte" || checkedExportAssistantOracle.valid;
  const activeBtn = assistantParamsIsValid && bridgesParamsIsValid && assistantOracleValid;

  // handles
  const handleChangeAssistantSymbol = (side, value) => {
    const validValue = String(value).toUpperCase().trim();
    const valid = value.length > 0 && value.length <= 24 && String(value).toUpperCase() === value;

    if (side === "home") {
      setHomeAssistantSharesSymbol({ value: validValue, valid, isTaken: undefined })
    } else {
      setForeignAssistantSharesSymbol({ value: validValue, valid, isTaken: undefined })
    }
  }

  const handleChangeAssistantParams = (side, name, value) => {
    const reg = /^[0-9.]+$/;
    const validValue = String(value).trim();

    if ((~(validValue + "").indexOf(".") ? (validValue + "").split(".")[1].length : 0) <= 2) {
      if (reg.test(String(validValue)) && !isNaN(Number(validValue))) {
        if (side === "home") {
          setHomeAssistantParams(p => ({ ...p, [name]: { value: validValue, valid: Number(validValue) < 100 } }))
        } else {
          setForeignAssistantParams(p => ({ ...p, [name]: { value: validValue, valid: Number(validValue) < 100 } }))
        }

      } else {
        if (side === "home") {
          setHomeAssistantParams(p => ({ ...p, [name]: { value: validValue, valid: false } }))
        } else {
          setForeignAssistantParams(p => ({ ...p, [name]: { value: validValue, valid: false } }))
        }
      }
    }
  }

  const handleChangeParams = (side, name, value) => {
    const validValue = String(value).trim();

    let valid;
    if (name === "stake_asset") valid = true

    if (side === "home") {
      setHomeParams((p) => ({
        ...p, [name]: {
          value: validValue,
          valid: valid || getParameterList(home_network)?.[name]?.validator(validValue)
        }
      }))
    } else if (side === "foreign") {
      setForeignParams((p) => ({
        ...p, [name]: {
          value: validValue,
          valid: valid || getParameterList(foreign_network)?.[name]?.validator(validValue)
        }
      }))
    }

    if (name === "stake_asset") {
      const stakeAssetParams = stakeTokens[foreign_network].find((t) => t.asset === value);

      setForeignParams(p => ({
        ...p,
        large_threshold: {
          value: stakeAssetParams ? stakeAssetParams?.large_threshold : "",
          valid: !!stakeAssetParams
        },
        min_stake: {
          value: stakeAssetParams ? stakeAssetParams?.min_stake : "",
          valid: !!stakeAssetParams
        }
      }));

    }
  }

  const isValidRecipient = (value, network) => {
    if (!network || !value)
      return undefined;

    if (network === "Obyte") {
      return obyte.utils.isValidAddress(value);
    } else if (Object.keys(chainIds[environment]).includes(network)) {
      try {
        return ethers.utils.getAddress(value) === value;
      }
      catch (e) {
        return false;
      }
    } else {
      return false
    }
  };

  const handleChangeOracleAddress = (network, value) => {
    setOracle({ value, valid: isValidRecipient(value, network) })
    setCheckedOracle({ valid: undefined, price: undefined });
  }

  const handleChangeExportAssistantOracleAddress = (network, value) => {
    setExportAssistantOracle({ value, valid: isValidRecipient(value, network) })
    setCheckedExportAssistantOracle({ valid: undefined, price: undefined });
  }

  const handleChangeManagerAddress = (side, network, value) => {
    let address = value;
    try {
      address = network !== "Obyte" ? ethers.utils.getAddress(value) : value;
    } catch {
      address = value
    }

    if (side === "home") {
      setHomeManagerAddress({ value: address, valid: isValidRecipient(address, network) })
    } else if (side === "foreign") {
      setForeignManagerAddress({ value: address, valid: isValidRecipient(address, network) })
    }
  }

  const handleChangeOraclesOnObyte = (name, value) => {
    setOracles((o) => ({ ...o, [name]: value }))
    setCheckedOracle({ valid: undefined, price: undefined });
  }

  const configure = () => {
    const home_params = {};
    Object.entries(homeParams).forEach(([key, { value }]) => home_params[key] = value);

    const foreign_params = {};
    Object.entries(foreignParams).forEach(([key, { value }]) => foreign_params[key] = value);

    const home_assistant_params = {};
    Object.entries(homeAssistantParams).forEach(([key, { value }]) => home_assistant_params[key] = +Number(value / 100).toFixed(4));

    const foreign_assistant_params = {};
    Object.entries(foreignAssistantParams).forEach(([key, { value }]) => foreign_assistant_params[key] = +Number(value / 100).toFixed(4));

    const home_manager_address = homeManagerAddress.value;
    const foreign_manager_address = foreignManagerAddress.value;

    let oraclesString;

    if (foreign_network !== "Obyte") {
      oraclesString = oracle.value;
    } else {
      const oraclesArray = [];

      const { feed_name1, feed_name2, feed_name3, oracle1, oracle2, oracle3, op1, op2, op3 } = oracles;
      if (oracle1 && feed_name1 && op1 && obyte.utils.isValidAddress(oracle1)) {
        oraclesArray.push(oracle1 + op1 + feed_name1);
      }
      if (oracle2 && feed_name2 && op2 && obyte.utils.isValidAddress(oracle2)) {
        oraclesArray.push(oracle2 + op2 + feed_name2);
      }
      if (oracle3 && feed_name3 && op3 && obyte.utils.isValidAddress(oracle3)) {
        oraclesArray.push(oracle3 + op3 + feed_name3);
      }

      oraclesString = oraclesArray.join(" ");
    }

    const params = {
      home_params,
      foreign_params,
      home_assistant_params,
      foreign_assistant_params,
      home_manager_address,
      foreign_manager_address,
      foreign_assistant_shares_symbol: foreignAssistantSharesSymbol.value,
      home_assistant_shares_symbol: homeAssistantSharesSymbol.value,
    };

    if (oraclesString) {
      params.oracles = oraclesString;
    }

    if (home_network !== "Obyte" && assistants_will_be_created) {
      params.export_assistant_oracle = exportAssistantOracle.value;
    }

    params.foreign_params.stake_asset_decimals = foreignParams?.stake_asset?.value && stakeTokens[foreign_network]?.find((t) => t.asset === foreignParams?.stake_asset?.value)?.decimals;

    params.home_params.large_threshold = ethers.utils.parseUnits(Number(params.home_params.large_threshold).toFixed(home_decimals), home_decimals).toString();
    params.foreign_params.large_threshold = ethers.utils.parseUnits(Number(params.foreign_params.large_threshold).toFixed(params.foreign_params.stake_asset_decimals), params.foreign_params.stake_asset_decimals).toString();

    params.home_params.min_stake = params.home_params.min_stake !== undefined && ethers.utils.parseUnits(Number(params.home_params.min_stake).toFixed(home_decimals), home_decimals).toString();
    params.foreign_params.min_stake = params.foreign_params.min_stake !== undefined && ethers.utils.parseUnits(Number(params.foreign_params.min_stake).toFixed(params.foreign_params.stake_asset_decimals), params.foreign_params.stake_asset_decimals).toString();

    dispatch(configureBridge(params));
  }

  const checkOracle = async () => {
    if (!oracles.oracle1 && foreign_network === "Obyte") return setCheckedOracle(false);

    const [valid, price] = await getOraclePrice({ ...oracles, network: foreign_network, home_asset, oracle: oracle.value });
    setCheckedOracle({ valid, price });

  }

  const checkExportAssistantOracle = async () => {
    if (!exportAssistantOracle.valid) return setCheckedExportAssistantOracle({ valid: false, price: 0 });

    const [valid, price] = await getOraclePrice({ network: home_network, home_asset: home_symbol, oracle: exportAssistantOracle.value });
    setCheckedExportAssistantOracle({ valid, price });
  }

  const getPeriodsDescription = (periodsStr) => {
    const periods = periodsStr ? periodsStr.trim().split(" ") : [];

    let description = "";
    periods.forEach((period, index) => {
      const num = index + 1;
      let prefix = "";

      if (String(num).endsWith("1")) {
        prefix = "st"
      } else if (String(num).endsWith("2")) {
        prefix = "nd"
      } else if (String(num).endsWith("3")) {
        prefix = "rd"
      } else {
        prefix = "th"
      }

      description += `${num}${prefix} period: ${+Number(period > 24 ? period / 24 : period).toFixed(3)} ${period > 24 ? "days" : "hours"}; `
    })

    return <p style={{ fontSize: 12 }}>{description}</p>;
  }

  const checkAssistantSymbolByType = (type) => {
    const symbol = type === "import" ? foreignAssistantSharesSymbol.value : homeAssistantSharesSymbol.value;
    const network = type === "import" ? foreign_network : home_network;

    let isTaken;

    if (network === "Obyte") {
      if ((`s2a_${symbol}` in tokenRegistryState) || symbol === "GBYTE") {
        isTaken = true;
      } else {
        isTaken = false;
      }
    } else {
      if (sharesSymbols?.includes(symbol)) {
        isTaken = true;
      } else {
        isTaken = false;
      }
    }

    if (type === "import") {
      setForeignAssistantSharesSymbol(t => ({ ...t, isTaken }));
    } else if (type === "export") {
      setHomeAssistantSharesSymbol(t => ({ ...t, isTaken }));
    }
  }

  return <div>
    <h2 style={{ marginTop: 50 }}>Bridge on {home_network} side (export)</h2>
    <Form>
      <Row gutter={8}>
        <Col md={{ span: 12 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Challenging periods <InfoTooltip title={getParameterList(home_network).challenging_periods.description} /></div>
          <Form.Item help={(!isEmpty(homeParams?.challenging_periods?.value) && !homeParams?.challenging_periods?.valid) ? getParameterList(home_network).challenging_periods.rule : getPeriodsDescription(homeParams?.challenging_periods?.value)} validateStatus={!isEmpty(homeParams?.challenging_periods?.value) ? (homeParams?.challenging_periods?.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Challenging periods" onChange={(e) => handleChangeParams("home", "challenging_periods", e.target.value)} value={homeParams.challenging_periods?.value} />
          </Form.Item>
        </Col>
        <Col md={{ span: 12 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Large challenging periods <InfoTooltip title={getParameterList(home_network).large_challenging_periods.description} /></div>
          <Form.Item help={(!isEmpty(homeParams?.large_challenging_periods?.value) && !homeParams?.large_challenging_periods?.valid) ? getParameterList(home_network).large_challenging_periods.rule : getPeriodsDescription(homeParams?.large_challenging_periods?.value)} validateStatus={!isEmpty(homeParams?.large_challenging_periods?.value) ? (homeParams.large_challenging_periods?.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Large challenging periods" onChange={(e) => handleChangeParams("home", "large_challenging_periods", e.target.value)} value={homeParams.large_challenging_periods?.value} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Large threshold <InfoTooltip title={getParameterList(home_network).large_threshold.description} /></div>
          <Form.Item help={(!isEmpty(homeParams?.large_threshold?.value) && !homeParams?.large_threshold?.valid) ? getParameterList(home_network).large_threshold.rule : ""} validateStatus={!isEmpty(homeParams?.large_threshold?.value) ? (homeParams.large_threshold.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Large threshold" suffix={home_symbol} onChange={(e) => handleChangeParams("home", "large_threshold", e.target.value)} value={homeParams.large_threshold?.value} />
          </Form.Item>
        </Col>
        {home_network === "Obyte" && <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Min stake <InfoTooltip title={getParameterList(home_network).min_stake.description} /></div>
          <Form.Item help={(!isEmpty(homeParams?.min_stake?.value) && !homeParams?.min_stake?.valid) ? getParameterList(home_network).min_stake.rule : ""} validateStatus={!isEmpty(homeParams?.min_stake?.value) ? (homeParams.min_stake.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Min stake" suffix={home_symbol} onChange={(e) => handleChangeParams("home", "min_stake", e.target.value)} value={homeParams.min_stake?.value} />
          </Form.Item>
        </Col>}
        {home_network === "Obyte" && <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Min tx age <InfoTooltip title={getParameterList(home_network).min_tx_age.description} /></div>
          <Form.Item help={(!isEmpty(homeParams?.min_tx_age?.value) && !homeParams?.min_tx_age?.valid) ? getParameterList(home_network).min_tx_age.rule : ""} validateStatus={!isEmpty(homeParams?.min_tx_age?.value) ? (homeParams.min_tx_age.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Min tx age" onChange={(e) => handleChangeParams("home", "min_tx_age", e.target.value)} value={homeParams.min_tx_age?.value} />
          </Form.Item>
        </Col>}
      </Row>
    </Form>

    <h2 style={{ marginTop: 50 }}>Bridge on {foreign_network} side (import)</h2>
    <Form>
      <Row gutter={8}>
        <Col md={{ span: 24 }} sm={{ span: 24 }} xs={{ span: 24 }}>
          <div className={styles.label}>Stake asset <InfoTooltip title={"stake asset info"} /></div>
          <Form.Item validateStatus={!isEmpty(foreignParams?.stake_asset?.value) ? (foreignParams.stake_asset.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Select placeholder="Stake asset" value={foreignParams?.stake_asset?.value} onChange={(value) => handleChangeParams("foreign", "stake_asset", value)}>
              {stakeTokens[foreign_network].map(({ symbol, asset }) => <Select.Option key={asset} value={asset}>{symbol}</Select.Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={8}>
        <Col md={{ span: 12 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Challenging periods <InfoTooltip title={getParameterList(home_network).challenging_periods.description} /></div>
          <Form.Item help={(!isEmpty(foreignParams?.challenging_periods?.value) && !foreignParams?.challenging_periods?.valid) ? getParameterList(foreign_network).challenging_periods.rule : getPeriodsDescription(foreignParams?.challenging_periods?.value)} validateStatus={!isEmpty(foreignParams?.challenging_periods?.value) ? (foreignParams.challenging_periods.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Challenging periods" value={foreignParams.challenging_periods?.value} onChange={(e) => handleChangeParams("foreign", "challenging_periods", e.target.value)} />
          </Form.Item>
        </Col>
        <Col md={{ span: 12 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Large challenging periods <InfoTooltip title={getParameterList(home_network).large_challenging_periods.description} /></div>
          <Form.Item help={(!isEmpty(foreignParams?.large_challenging_periods?.value) && !foreignParams?.large_challenging_periods?.valid) ? getParameterList(foreign_network).large_challenging_periods.rule : getPeriodsDescription(foreignParams?.large_challenging_periods?.value)} validateStatus={!isEmpty(foreignParams?.large_challenging_periods?.value) ? (foreignParams.large_challenging_periods.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Large challenging periods" value={foreignParams.large_challenging_periods?.value} onChange={(e) => handleChangeParams("foreign", "large_challenging_periods", e.target.value)} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={8}>
        <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Large threshold <InfoTooltip title={getParameterList(home_network).large_threshold.description} /></div>
          <Form.Item help={(!isEmpty(foreignParams?.large_threshold?.value) && !foreignParams?.large_threshold?.valid) ? getParameterList(foreign_network).large_threshold.rule : ""} validateStatus={!isEmpty(foreignParams?.large_threshold?.value) ? (foreignParams.large_threshold.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Large threshold" suffix={stakeTokens[foreign_network]?.find((t) => t.asset === foreignParams.stake_asset?.value)?.symbol || ""} value={foreignParams.large_threshold?.value} onChange={(e) => handleChangeParams("foreign", "large_threshold", e.target.value)} />
          </Form.Item>
        </Col>
        {foreign_network === "Obyte" && <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Min stake <InfoTooltip title={getParameterList(home_network).min_stake.description} /></div>
          <Form.Item help={(!isEmpty(foreignParams?.min_stake?.value) && !foreignParams?.min_stake?.valid) ? getParameterList(foreign_network).min_stake.rule : ""} validateStatus={!isEmpty(foreignParams?.min_stake?.value) ? (foreignParams.min_stake.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Min stake" suffix={stakeTokens[foreign_network]?.find((t) => t.asset === foreignParams.stake_asset?.value)?.symbol || ""} value={foreignParams.min_stake?.value} onChange={(e) => handleChangeParams("foreign", "min_stake", e.target.value)} />
          </Form.Item>
        </Col>}
        {foreign_network === "Obyte" && <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Min tx age <InfoTooltip title={getParameterList(home_network).min_tx_age.description} /></div>
          <Form.Item help={(!isEmpty(foreignParams?.min_tx_age?.value) && !foreignParams?.min_tx_age?.valid) ? getParameterList(foreign_network).min_tx_age.rule : ""} validateStatus={!isEmpty(foreignParams?.min_tx_age?.value) ? (foreignParams.min_tx_age.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Min tx age" value={foreignParams.min_tx_age?.value} onChange={(e) => handleChangeParams("foreign", "min_tx_age", e.target.value)} />
          </Form.Item>
        </Col>}
      </Row>

      {foreign_network !== "Obyte" ? <Row gutter={8}>
        <Col md={{ span: 24 }} sm={{ span: 24 }} xs={{ span: 24 }}>
          <div className={styles.label}>Oracle <InfoTooltip title={getParameterList(home_network).oracles.description} /></div>
          <Form.Item hasFeedback={true}>
            <Input.Group compact>
              <Input
                placeholder="Oracle"
                autoComplete="off"
                style={{ width: 'calc(100% - 81px)' }}
                className="evmHashOrAddress"
                spellCheck="false"
                onChange={(e) => handleChangeOracleAddress(foreign_network, e.target.value)}
                value={oracle.value}
              />
              <Button type="primary" size="large" disabled={checkedOracle.valid !== undefined} onClick={checkOracle}>Check</Button>
            </Input.Group>
          </Form.Item>
        </Col>
      </Row> : <div>
        <div className={styles.label}>Oracles <InfoTooltip title={getParameterList(home_network).oracles.description} /></div>
        <Row >
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 11 }}>
            <Form.Item>
              <AutoComplete
                placeholder="Oracle 1"
                style={{ width: "100%" }}
                value={oracles.oracle1}
                onSearch={(value) => handleChangeOraclesOnObyte("oracle1", value)}
                onSelect={(value) => handleChangeOraclesOnObyte("oracle1", value)}
              >
                {oracleList.map(oracleAddress => <AutoComplete.Option key={oracleAddress} value={oracleAddress}>{oracleAddress}</AutoComplete.Option>)}
              </AutoComplete>
            </Form.Item>
          </Col>
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 7, offset: 1 }}>
            <Form.Item>
              <AutoComplete
                placeholder="Feed name 1"
                autoComplete="off"
                value={oracles.feed_name1}
                onSearch={(value) => handleChangeOraclesOnObyte("feed_name1", value)}
                onSelect={(value) => handleChangeOraclesOnObyte("feed_name1", value)}
              >
                {feedNameList.map(feedName => <AutoComplete.Option key={feedName} value={feedName}>{feedName}</AutoComplete.Option>)}
              </AutoComplete>
            </Form.Item>
          </Col>
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 4, offset: 1 }}>
            <Form.Item>
              <Select
                placeholder="Operation 1"
                style={{ width: "100%" }}
                value={oracles.op1}
                onChange={(value) => handleChangeOraclesOnObyte("op1", value)}
              >
                <Select.Option value={"*"}>*</Select.Option>
                <Select.Option value={"/"}>/</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 11 }}>
            <Form.Item>
              <AutoComplete
                placeholder="Oracle 2"
                style={{ width: "100%" }}
                value={oracles.oracle2}
                onSearch={(value) => handleChangeOraclesOnObyte("oracle2", value)}
                onSelect={(value) => handleChangeOraclesOnObyte("oracle2", value)}
              >
                {oracleList.map(oracleAddress => <AutoComplete.Option key={oracleAddress} value={oracleAddress}>{oracleAddress}</AutoComplete.Option>)}
              </AutoComplete>
            </Form.Item>
          </Col>
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 7, offset: 1 }}>
            <Form.Item>
              <AutoComplete
                placeholder="Feed name 2"
                autoComplete="off"
                value={oracles.feed_name2}
                onSearch={(value) => handleChangeOraclesOnObyte("feed_name2", value)}
                onSelect={(value) => handleChangeOraclesOnObyte("feed_name2", value)}
              >
                {feedNameList.map(feedName => <AutoComplete.Option key={feedName} value={feedName}>{feedName}</AutoComplete.Option>)}
              </AutoComplete>
            </Form.Item>
          </Col>
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 4, offset: 1 }}>
            <Form.Item>
              <Select
                placeholder="Operation 2"
                style={{ width: "100%" }}
                value={oracles.op2}
                onChange={(value) => handleChangeOraclesOnObyte("op2", value)}
              >
                <Select.Option value={"*"}>*</Select.Option>
                <Select.Option value={"/"}>/</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 11 }}>
            <Form.Item>
              <AutoComplete
                placeholder="Oracle 3"
                autoComplete="off"
                style={{ width: "100%" }}
                value={oracles.oracle3}
                onSearch={(value) => handleChangeOraclesOnObyte("oracle3", value)}
                onSelect={(value) => handleChangeOraclesOnObyte("oracle3", value)}
              >
                {oracleList.map(oracleAddress => <AutoComplete.Option key={oracleAddress} value={oracleAddress}>{oracleAddress}</AutoComplete.Option>)}
              </AutoComplete>
            </Form.Item>
          </Col>
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 7, offset: 1 }}>
            <Form.Item>
              <AutoComplete
                placeholder="Feed name 3"
                autoComplete="off"
                value={oracles.feed_name3}
                onSearch={(value) => handleChangeOraclesOnObyte("feed_name3", value)}
                onSelect={(value) => handleChangeOraclesOnObyte("feed_name3", value)}
              >
                {feedNameList.map(feedName => <AutoComplete.Option key={feedName} value={feedName}>{feedName}</AutoComplete.Option>)}
              </AutoComplete>
            </Form.Item>
          </Col>
          <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 4, offset: 1 }}>
            <Form.Item>
              <Select
                placeholder="Operation 3"
                style={{ width: "100%" }}
                value={oracles.op3}
                onChange={(value) => handleChangeOraclesOnObyte("op3", value)}
              >
                <Select.Option value={"*"}>*</Select.Option>
                <Select.Option value={"/"}>/</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>}
      {foreign_network === "Obyte" && <Row>
        <Form.Item>
          <Button type="primary" disabled={checkedOracle.valid !== undefined} onClick={checkOracle}>Check oracle</Button>
        </Form.Item>
      </Row>}

      <Row>
        {checkedOracle.valid !== undefined && (checkedOracle.valid ? <div style={{ color: "green" }}>
          <div>1 {foreign_symbol} = {Number(checkedOracle.price)} {stake_asset_symbol}</div>
          <div>1 {stake_asset_symbol} = {+Number(1 / checkedOracle.price)} {foreign_symbol}</div>
        </div> : <div style={{ color: "red" }}>Oracle is invalid or empty </div>)}
      </Row>
    </Form>

    {assistants_will_be_created && <div style={{ opacity: checkedOracle.valid ? 1 : 0.2 }}>
      <h2 style={{ marginTop: 50 }}>Assistants on {home_network} side (export)</h2>
      <Form>
        <Row gutter={8}>
          <Col md={{ span: 16 }} sm={{ span: 24 }} xs={{ span: 24 }}>
            <div className={styles.label}>Manager <InfoTooltip title="The pool’s manager who is responsible for claiming transfers and challenging fraudulent claims on behalf of the pool." /></div>
            <Form.Item extra={<span>Address of your <a href="https://github.com/byteball/counterstake-bridge" target="_blank" rel="noopener">assistant bot</a>. Run the bot to learn its address.</span>} validateStatus={!isEmpty(homeManagerAddress?.value) ? (homeManagerAddress.valid ? "success" : "error") : undefined} hasFeedback={true}>
              <Input placeholder={`${home_network} address`} spellCheck="false" className="evmHashOrAddress" value={homeManagerAddress?.value} onChange={(e) => handleChangeManagerAddress("home", home_network, e.target.value)} />
            </Form.Item>
          </Col>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <div className={styles.label}>Shares symbol</div>
            <Form.Item validateStatus={!isEmpty(homeAssistantSharesSymbol?.value) ? (homeAssistantSharesSymbol.valid ? "success" : "error") : undefined}>
              <Input.Group compact>
                <Input placeholder="Shares symbol" style={{ width: 'calc(100% - 81px)' }} value={homeAssistantSharesSymbol?.value} onChange={(e) => handleChangeAssistantSymbol("home", e.target.value)} />
                <Button size="large" disabled={homeAssistantSharesSymbol?.isTaken !== undefined || !homeAssistantSharesSymbol.valid} onClick={() => checkAssistantSymbolByType("export")} type="primary">Check</Button>
              </Input.Group>
              {homeAssistantSharesSymbol.isTaken !== undefined && <div>
                {homeAssistantSharesSymbol.isTaken ? <div style={{ color: "red" }}>Symbol already taken</div> : <div style={{ color: "green" }}>Symbol available</div>}
              </div>}
            </Form.Item>
          </Col>
        </Row>

        {home_network !== "Obyte" && <Row gutter={8}>
          <Col md={{ span: 24 }} sm={{ span: 24 }} xs={{ span: 24 }}>
            <div>Oracle <InfoTooltip title="Oracles that report the price of asset in terms of native asset." /></div>
            <Form.Item
              validateStatus={!isEmpty(oracle.value) ? (oracle.valid ? "success" : "error") : undefined}
            >
              <Input.Group compact>
                <Input
                  placeholder="Oracle"
                  autoComplete="off"
                  style={{ width: 'calc(100% - 81px)' }}
                  className="evmHashOrAddress"
                  spellCheck="false"
                  onChange={(e) => handleChangeExportAssistantOracleAddress(home_network, e.target.value)}
                  value={exportAssistantOracle.value}
                />
                <Button size="large" disabled={!exportAssistantOracle.valid || checkedExportAssistantOracle.valid !== undefined} onClick={checkExportAssistantOracle} type="primary">Check</Button>
              </Input.Group>
              {home_network !== "Obyte" && checkedExportAssistantOracle.valid !== undefined && <>
                {checkedExportAssistantOracle.valid ? <div style={{ color: "green", marginBottom: 10 }}>
                  <div>1 {home_symbol} = {checkedExportAssistantOracle.price} {nativeSymbols[home_network]}</div>
                  <div>1 {nativeSymbols[home_network]} = {+Number(1 / checkedExportAssistantOracle.price)} {home_symbol}</div>
                </div> : <div style={{ color: "red", marginBottom: 10 }}>Oracle is invalid or empty</div>}
              </>}
            </Form.Item>
          </Col>
        </Row>}

        <Row gutter={8}>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <div className={styles.label}>Management fee <InfoTooltip title="Yearly fee charged by the manager for managing the pool." /></div>
            <Form.Item help={(!isEmpty(foreignParams?.management_fee?.value) && !foreignParams?.management_fee?.valid) ? getParameterList(foreign_network).management_fee.rule : ""} validateStatus={!isEmpty(homeAssistantParams?.management_fee?.value) ? (homeAssistantParams.management_fee.valid ? "success" : "error") : undefined} hasFeedback={true}>
              <Input placeholder="Management fee" suffix="%" value={homeAssistantParams?.management_fee?.value} onChange={(ev) => handleChangeAssistantParams("home", "management_fee", ev.target.value)} />
            </Form.Item>
          </Col>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <div className={styles.label}>Success fee <InfoTooltip title="Manager’s share of the pool’s profits." /></div>
            <Form.Item help={(!isEmpty(foreignParams?.success_fee?.value) && !foreignParams?.success_fee?.valid) ? getParameterList(foreign_network).success_fee.rule : ""} validateStatus={!isEmpty(homeAssistantParams?.success_fee?.value) ? (homeAssistantParams.success_fee.valid ? "success" : "error") : undefined} hasFeedback={true}>
              <Input placeholder="Success fee" suffix="%" value={homeAssistantParams?.success_fee?.value} onChange={(ev) => handleChangeAssistantParams("home", "success_fee", ev.target.value)} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <h2 style={{ marginTop: 50 }}>Assistants on {foreign_network} side (import)</h2>
      <Form>
        <Row gutter={8}>
          <Col md={{ span: 16 }} sm={{ span: 24 }} xs={{ span: 24 }}>
            <div className={styles.label}>Manager <InfoTooltip title="The pool’s manager who is responsible for claiming transfers and challenging fraudulent claims on behalf of the pool." /></div>
            <Form.Item validateStatus={!isEmpty(foreignManagerAddress?.value) ? (foreignManagerAddress.valid ? "success" : "error") : undefined} hasFeedback={true} extra={<span>Address of your <a href="https://github.com/byteball/counterstake-bridge" target="_blank" rel="noopener">assistant bot</a>. Run the bot to learn its address.</span>}>
              <Input placeholder={`${foreign_network} address`} spellCheck="false" className="evmHashOrAddress" value={foreignManagerAddress?.value} onChange={(e) => handleChangeManagerAddress("foreign", foreign_network, e.target.value)} />
            </Form.Item>
          </Col>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <div className={styles.label}>Shares symbol</div>
            <Form.Item validateStatus={!isEmpty(foreignAssistantSharesSymbol?.value) ? (foreignAssistantSharesSymbol.valid ? "success" : "error") : "undefined"}>
              <Input.Group compact>
                <Input placeholder="Shares symbol" style={{ width: 'calc(100% - 81px)' }} value={foreignAssistantSharesSymbol?.value} onChange={(e) => handleChangeAssistantSymbol("foreign", e.target.value)} />
                <Button size="large" disabled={foreignAssistantSharesSymbol?.isTaken !== undefined || !foreignAssistantSharesSymbol.valid} onClick={() => checkAssistantSymbolByType("import")} type="primary">Check</Button>
              </Input.Group>
              {foreignAssistantSharesSymbol.isTaken !== undefined && <div>
                {foreignAssistantSharesSymbol.isTaken ? <div style={{ color: "red" }}>Symbol already taken</div> : <div style={{ color: "green" }}>Symbol available</div>}
              </div>}
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={8}>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <div className={styles.label}>Management fee <InfoTooltip title="Yearly fee charged by the manager for managing the pool." /></div>
            <Form.Item validateStatus={!isEmpty(foreignAssistantParams?.management_fee?.value) ? (foreignAssistantParams.management_fee.valid ? "success" : "error") : undefined} hasFeedback={true}>
              <Input placeholder="Management fee" suffix="%" value={foreignAssistantParams?.management_fee?.value} onChange={(ev) => handleChangeAssistantParams("foreign", "management_fee", ev.target.value)} />
            </Form.Item>
          </Col>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <div className={styles.label}>Success fee <InfoTooltip title="Manager’s share of the pool’s profits." /></div>
            <Form.Item validateStatus={!isEmpty(foreignAssistantParams?.success_fee?.value) ? (foreignAssistantParams.success_fee.valid ? "success" : "error") : undefined} hasFeedback={true}>
              <Input placeholder="Success fee" suffix="%" value={foreignAssistantParams?.success_fee?.value} onChange={(ev) => handleChangeAssistantParams("foreign", "success_fee", ev.target.value)} />
            </Form.Item>
          </Col>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <div className={styles.label}>Swap fee <InfoTooltip title={`Fee charged when swapping between ${foreign_symbol} and ${stake_asset_symbol || "stake asset"} in the pool`} /></div>
            <Form.Item validateStatus={!isEmpty(foreignAssistantParams?.swap_fee?.value) ? (foreignAssistantParams.swap_fee.valid ? "success" : "error") : undefined} hasFeedback={true}>
              <Input placeholder="Swap fee" value={foreignAssistantParams?.swap_fee?.value} onChange={(ev) => handleChangeAssistantParams("foreign", "swap_fee", ev.target.value)} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>}

    <Button type="primary" onClick={configure} disabled={!activeBtn}>Continue: create bridge</Button>
  </div>
}