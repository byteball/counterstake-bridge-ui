import { Form, Select, Row, Col, Input, Switch, Button } from "antd";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import { isEmpty } from "lodash";

import { nativeSymbols } from "nativeSymbols";
import { chainIds } from "chainIds";
import { getDecimals, getSymbol } from "utils";
import { addCreationOrder, selectExportedTokens } from "store/settingsSlice";

import { ReactComponent as ObyteNetwork } from "pages/Main/img/networks/obyte.svg";
import { ReactComponent as BscNetwork } from "pages/Main/img/networks/bsc.svg";
import { ReactComponent as EthNetwork } from "pages/Main/img/networks/eth.svg";
import { ReactComponent as PolygonNetwork } from "pages/Main/img/networks/polygon.svg";
import { ReactComponent as DefaultNetwork } from "pages/Main/img/networks/default.svg";

import { selectTokenRegistryState } from "store/tokenRegistrySlice";
import { estimateGasForCreationBridge } from "../CreateBridgeSteps/utils/estimateGas";

import config from "appConfig";

import styles from "../../CreatePage.module.css";

const environment = config.ENVIRONMENT;

const initValue = { value: "", valid: false };

export const CreateBridgeForm = () => {
  const networks = ["Obyte", ...Object.keys(nativeSymbols)];
  const dispatch = useDispatch();
  // states
  const [homeNetwork, setHomeNetwork] = useState({ value: "Obyte", valid: true });
  const [homeDecimals, setHomeDecimals] = useState({ value: "", valid: false, loading: false });
  const [homeSymbol, setHomeSymbol] = useState({ value: "", valid: false, loading: false });

  const [tokenAddress, setTokenAddress] = useState({ value: "", valid: false, equal_asset: "" });

  const [foreignNetwork, setForeignNetwork] = useState({ value: "Ethereum", valid: true });
  const [foreignDecimals, setForeignDecimals] = useState({ value: "", valid: false });
  const [foreignSymbol, setForeignSymbol] = useState({ value: "", valid: false, isTaken: null });
  const [foreignDescription, setForeignDescription] = useState({ value: "", valid: false, help: true });
  const [assistantsWillBeCreated, setAssistantsWillBeCreated] = useState({ value: false, valid: false });
  const [estimateGas, setEstimateGas] = useState({ value: 0, loading: false, error: false });

  const tokenRegistryState = useSelector(selectTokenRegistryState);
  const exportedTokens = useSelector(selectExportedTokens);


  useEffect(async () => {
    setEstimateGas({ value: 0, loading: true, error: false });
    try {
      const gas = await estimateGasForCreationBridge({ home_network: homeNetwork.value, foreign_network: foreignNetwork.value, home_asset: (tokenAddress.equal_asset || tokenAddress.value), assistantsWillBeCreated: assistantsWillBeCreated.value });
      setEstimateGas({ value: gas, loading: false, error: false });
    } catch (e) {
      setEstimateGas({ value: 0, loading: false, error: true });
    }
  }, [homeNetwork, foreignNetwork, tokenAddress, assistantsWillBeCreated]);

  const exportedTokensByNetwork = exportedTokens?.[homeNetwork.value]?.[foreignNetwork.value] || [];
  // handles
  const handleChangeHomeNetwork = (value) => {
    setHomeNetwork({ value, valid: true });
    setTokenAddress(initValue);
    setHomeSymbol(initValue);
    setHomeDecimals(initValue);
    if (value === foreignNetwork.value) {
      const freeNetwork = networks.find((n) => n !== value);
      handleChangeForeignNetwork(freeNetwork);
    }
  };

  const handleChangeForeignNetwork = (value) => setForeignNetwork({ value, valid: true });

  useEffect(()=> {
    handleChangeForeignSymbol(null, foreignSymbol.value);
  }, [foreignNetwork]);

  const handleChangeForeignDecimals = (e) => setForeignDecimals({ value: e.target.value, valid: e.target.value !== "" && Number(e.target.value) >= 0 && e.target.value <= (foreignNetwork.value === "Obyte" ? 15 : 18) });

  const switchAssistants = (checked) => setAssistantsWillBeCreated({ value: checked, valid: true });

  const handleChangeForeignDescription = (e) => setForeignDescription({ value: e.target.value, valid: e.target.value !== "" && e.target.value.length > 0 && e.target.value.length <= 50 });

  const handleChangeForeignSymbol = async (e, targetValue) => {
    const value = String(e ? e.target.value : targetValue).toUpperCase().trim();
    let isTaken = false;
    const valid = value !== "" && value.length >= 0 && value.length <= 11;

    if (foreignNetwork.value === "Obyte") {
      if ((`s2a_${value}` in tokenRegistryState) || value === "GBYTE") {
        isTaken = true;
      } else {
        isTaken = false;
      }
    }

    setForeignSymbol({ value, valid, isTaken, loading: false });

  }

  const isValidAddress = value => {
    if (!homeNetwork.value || !value)
      return undefined;

    if (homeNetwork.value === "Obyte") {
      return value.length === 44
    } else if (Object.keys(chainIds[environment]).includes(homeNetwork.value)) {
      try {
        return ethers.utils.isAddress(value);
      }
      catch (e) {
        return false;
      }
    } else {
      return false
    }
  };

  const clearForm = () => {
    setHomeSymbol({ value: "", valid: false, loading: false })
    setHomeDecimals({ value: "", valid: false, loading: false })
    setForeignSymbol({ value: "", valid: false, loading: false, isTaken: undefined })
    setForeignDecimals({ value: "", valid: false, loading: false })
  }

  const handleChangeHomeToken = async (e) => {
    let value = String(e.target.value).trim();

    let valid = isValidAddress(value);

    if (homeNetwork.value !== "Obyte" && valid) {
      value = ethers.utils.getAddress(value);
    }

    let equal_asset;
    let isDisplayed = false;

    if (valid) {
      setTokenAddress({ value, valid });
      isDisplayed = true;

      setHomeSymbol((s) => ({ ...s, value: "", loading: true }));
      setHomeDecimals((d) => ({ ...d, value: "", loading: true }));

      setForeignSymbol((d) => ({ ...d, value: "", loading: true, isTaken: undefined }));
      setForeignDecimals((d) => ({ ...d, value: "", loading: true }));

      let symbol = await getSymbol(value, homeNetwork.value);

      if (symbol && symbol !== value) {
        symbol = String(symbol).toUpperCase();

        setHomeSymbol(s => ({ ...s, loading: false }));
        handleChangeHomeSymbol("", symbol);
        const decimals = await getDecimals(value, homeNetwork.value);
        setHomeDecimals({ value: decimals, valid: true, loading: false });
        handleChangeForeignSymbol(null, symbol);
        if (foreignNetwork.value === "Obyte") {
          setForeignDecimals({ value: decimals <= 15 ? decimals : 9, valid: true, loading: false })
        }
      } else {
        clearForm()
      }
    } else if (value === "") {
      clearForm()
    } else if (tokenRegistryState && homeNetwork.value === "Obyte" && value === String(value).toUpperCase()) {
      if ((`s2a_${value}` in tokenRegistryState)) {
        const asset = tokenRegistryState[`s2a_${value}`];
        const current_desc = tokenRegistryState[`current_desc_${asset}`];

        if (`decimals_${current_desc}` in tokenRegistryState) {
          const decimals = tokenRegistryState[`decimals_${current_desc}`];

          if (decimals !== undefined) {
            valid = true;
            equal_asset = asset;

            handleChangeHomeSymbol("", value);
            setHomeDecimals({ value: decimals, valid: true, loading: false });
            handleChangeForeignSymbol(null, value)
          }
        }
      } else if (value === "GBYTE") {
        valid = true;
        equal_asset = "base";
        handleChangeHomeSymbol("", value);
        setHomeDecimals({ value: 9, valid: true, loading: false });
        handleChangeForeignSymbol(null, value);
      } else {
        clearForm()
      }
    } else {
      clearForm()
    }

    if (!isDisplayed) {
      setTokenAddress({ value, valid, equal_asset });
    }
  };


  const handleChangeHomeSymbol = async (e, tokenSymbol) => {
    const value = tokenSymbol || e?.target?.value;
    const valid = value !== "" && value.length >= 0 && value.length <= 11;
    setHomeSymbol({ value: String(value).toUpperCase(), valid });
    setForeignDescription((d) => ({ ...d, value: `Imported ${String(value).toUpperCase()}`, valid: true }))
  }

  const createOrder = () => {
    dispatch(addCreationOrder({
      home_decimals: Number(homeDecimals.value),
      home_asset: tokenAddress.equal_asset || tokenAddress.value,
      home_symbol: homeSymbol.value,
      home_network: homeNetwork.value,

      foreign_decimals: foreignNetwork.value === "Obyte" ? Number(foreignDecimals.value) : 18,
      foreign_symbol: foreignSymbol.value,
      foreign_network: foreignNetwork.value,
      foreign_description: foreignDescription.value,
      assistants_will_be_created: assistantsWillBeCreated.value,
      orderType: "bridge"
    }));
  }

  if (isEmpty(tokenRegistryState)) return "Loading..."

  let tokenHelp = "";

  if (tokenAddress.value !== "" && !homeSymbol.loading && !homeDecimals.loading) {
    if (!tokenAddress.valid && homeNetwork.value !== "Obyte") {
      tokenHelp = <p style={{ color: "red" }}>Token address isn't valid</p>
    } else if (exportedTokensByNetwork.includes(tokenAddress.equal_asset || tokenAddress.value)) {
      tokenHelp = <p style={{ color: "red" }}>Bridge already exists</p>
    } else if (!homeSymbol.value || !homeDecimals.valid || !tokenAddress.valid) {
      if (homeNetwork.value === "Obyte") {
        tokenHelp = <p style={{ color: "red" }}>Please add the token to the {<a style={{ color: "red", textDecoration: "underline" }} target="_blank" href={`https://${environment === "testnet" && "testnet."}tokens.ooo`} rel="noopener">registry</a>}.</p>
      } else {
        tokenHelp = <p style={{ color: "red" }}>We could not get information about the token</p>
      }
    } else if (homeSymbol.value && !homeSymbol.loading) {
      tokenHelp = <p style={{ color: "green" }}>Recognized token: {homeSymbol.value} (decimals: {homeDecimals.value})</p>;
    }
  }

  return <div>
    <Form>
      <div style={{ fontSize: 26, fontWeight: "bold", marginBottom: 10 }}>From: </div>
      <Row gutter={8}>
        <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Network:</div>
          <Form.Item>
            <Select placeholder="Network" value={homeNetwork.value} onChange={handleChangeHomeNetwork}>
              {networks.map(network => {
                let NetworkIcon;
                if (network === "Obyte") {
                  NetworkIcon = ObyteNetwork
                } else if (network === "BSC") {
                  NetworkIcon = BscNetwork
                } else if (network === "Ethereum") {
                  NetworkIcon = EthNetwork
                } else if (network === "Polygon") {
                  NetworkIcon = PolygonNetwork
                } else {
                  NetworkIcon = DefaultNetwork
                }

                return <Select.Option value={network} key={`home-${network}`}>
                  <div style={{ display: "flex", alignItems: "center" }}><NetworkIcon style={{ height: "2em", marginRight: 10 }} /> {network}</div>
                </Select.Option>
              })}
            </Select>
          </Form.Item>
        </Col>
        <Col md={{ span: 16 }} sm={{ span: 24 }} xs={{ span: 24 }}>
          <div className={styles.label}>Token {homeNetwork.value === "Obyte" ? "symbol" : "address"}:</div>
          <Form.Item validateStatus={tokenAddress.value ? (tokenAddress.valid ? "success" : "error") : undefined} hasFeedback={true} extra={tokenHelp}>
            <Input placeholder={`Token ${homeNetwork.value === "Obyte" ? "symbol" : "address"}`} spellCheck="false" className="evmHashOrAddress" onChange={handleChangeHomeToken} value={tokenAddress.value} />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ fontSize: 26, fontWeight: "bold", marginBottom: 10 }}>To: </div>
      <Row gutter={8}>
        <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
          <div className={styles.label}>Network:</div>
          <Form.Item>
            <Select placeholder="Network" onChange={handleChangeForeignNetwork} value={foreignNetwork.value}>
              {networks.map(network => {
                let NetworkIcon;
                if (network === "Obyte") {
                  NetworkIcon = ObyteNetwork
                } else if (network === "BSC") {
                  NetworkIcon = BscNetwork
                } else if (network === "Ethereum") {
                  NetworkIcon = EthNetwork
                } else if (network === "Polygon") {
                  NetworkIcon = PolygonNetwork
                } else {
                  NetworkIcon = DefaultNetwork
                }

                return <Select.Option value={network} key={`foreign-${network}`} disabled={network === homeNetwork.value}>
                  <div style={{ display: "flex", alignItems: "center" }}><NetworkIcon style={{ height: "2em", marginRight: 10, opacity: homeNetwork.value === network ? 0.5 : 1 }} /> {network}</div>
                </Select.Option>
              })}
            </Select>
          </Form.Item>
        </Col>
        <Col md={{ span: 8 }} sm={{ span: 24 }} xs={{ span: 24 }}>
          <div className={styles.label}>Decimals:</div>
          <Form.Item validateStatus={foreignDecimals.value !== "" ? (foreignDecimals.valid ? "success" : "error") : undefined} hasFeedback={true}>
            <Input placeholder="Decimals" disabled={foreignSymbol.loading || foreignNetwork.value !== "Obyte"} value={foreignNetwork.value === "Obyte" ? foreignDecimals.value : 18} onChange={handleChangeForeignDecimals} />
          </Form.Item>
        </Col>
        <Col md={{ span: 8 }} sm={{ span: 24 }} xs={{ span: 24 }}>
          <div className={styles.label}>Symbol:</div>
          <Form.Item validateStatus={foreignSymbol.value !== "" ? (foreignSymbol.valid && (foreignNetwork.value !== "Obyte" || foreignSymbol.isTaken !== true) ? "success" : "error") : undefined} hasFeedback={true} extra={foreignSymbol.isTaken !== undefined && foreignNetwork.value === "Obyte" && <div>
            {foreignSymbol.value && foreignSymbol.valid && (foreignSymbol.isTaken ? <div style={{ color: "red" }}>Symbol already taken</div> : <div style={{ color: "green" }}>Symbol available</div>)}
          </div>}>
            <Input placeholder="Symbol" disabled={foreignSymbol.loading} value={foreignSymbol.value} onChange={handleChangeForeignSymbol} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col md={{ span: 24 }} sm={{ span: 24 }} xs={{ span: 24 }}>
          <div className={styles.label}>Token description:</div>
          <Form.Item validateStatus={foreignDescription.value !== "" ? (foreignDescription.valid ? "success" : "error") : undefined}>
            <Input placeholder="Description" value={foreignDescription.value} onChange={handleChangeForeignDescription} />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col md={{ span: 24 }} sm={{ span: 24 }} xs={{ span: 24 }}>
          <Form.Item>
            Create pooled assistants?<Switch style={{ marginLeft: 8 }} checkedChildren="Yes" unCheckedChildren="No" checked={assistantsWillBeCreated.value} onChange={switchAssistants} />
            <p style={{ fontSize: 12, marginTop: 20 }}><a href="https://github.com/byteball/counterstake-bridge" target="_blank" rel="noopener">Assistants</a> accelerate user transfers and check the validity of claims. Without assistants, transfers would take too long (3 days by default). If you plan to run solo assistants and provide them with sufficient liquidity yourself, you can skip pooled assistants. Otherwise, create pooled assistants and enable the token community to provide liquidity and earn rewards from transfers. You can create pooled assistants later if you skip them now.</p>
          </Form.Item>
        </Col>
      </Row>

      {foreignSymbol.valid && <Row style={{ color: "#faad14" }}>
        {!estimateGas.loading ? <div style={{ marginBottom: 20 }}>
          {assistantsWillBeCreated.value ? <div>
            Estimated gas cost: <b>${estimateGas.value}</b>. After you create the bridge, please make sure that {foreignSymbol.value} users know about its existence and start using it. Also, encourage the users to add liquidity to the new assistants.
          </div> : <div>
            Estimated gas cost: <b>${estimateGas.value}</b>. After you create the bridge, please make sure that {foreignSymbol.value} users know about its existence and start using it.
          </div>}
        </div> : <div style={{ marginBottom: 20 }}>Calculate the estimated cost of gas...</div>}
      </Row>}

      <Row>
        <Form.Item>
          <Button type="primary" onClick={createOrder} disabled={foreignSymbol.isTaken || !foreignSymbol.valid || !tokenAddress.valid || (!foreignDecimals.valid && foreignNetwork.value === "Obyte") || !foreignSymbol.valid || !foreignDescription.valid || !homeDecimals.valid || !homeSymbol.valid || exportedTokensByNetwork.includes(tokenAddress.equal_asset || tokenAddress.value)}>Continue: configure bridge</Button>
        </Form.Item>
      </Row>
    </Form>
  </div>
}