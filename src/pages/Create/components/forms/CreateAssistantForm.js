import { useSelector, useDispatch } from 'react-redux';
import { Select, Form, Input, Button, Row, Col } from 'antd';
import { useState, useEffect } from 'react';
import obyte from "obyte";
import { ethers } from "ethers";
import { isNaN } from "lodash";

import { chainIds } from "chainIds";
import { addCreationOrder } from "store/settingsSlice";
import { assistantFactoryAAs } from "../../components/tabs/CreateAssistant";
import { selectSharesSymbols } from "store/assistantsSlice";
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip";
import { selectBridgeAAs, selectList } from "store/governanceSlice";
import { selectDestAddress, setDestAddress } from "store/destAddressSlice";
import { getSymbol } from "utils";
import { selectTokenRegistryState } from 'store/tokenRegistrySlice';
import { estimateGasForCreationAssistant } from '../CreateBridgeSteps/utils/estimateGas';

const { Option } = Select;

export const initialImportParams = {
  management_fee: 0.01,
  success_fee: 0.1,
  swap_fee: 0.001
}

export const initialExportParams = {
  management_fee: 0.01,
  success_fee: 0.1
}

const environment = process.env.REACT_APP_ENVIRONMENT;

export const CreateAssistantForm = () => {
  const dispatch = useDispatch();
  const list = useSelector(selectList);
  const bridgeAAs = useSelector(selectBridgeAAs);
  const addresses = useSelector(selectDestAddress);
  const sharesSymbols = useSelector(selectSharesSymbols);
  const tokenRegistryState = useSelector(selectTokenRegistryState);

  const [selectedBridgeSide, setSelectedBridgeSide] = useState();
  const [currentParams, setCurrentParams] = useState();
  const [symbol, setSymbol] = useState({ value: undefined, isTaken: null, isLoading: false });
  const [manager, setManager] = useState({});
  const [stakeSymbol, setStakeSymbol] = useState(null);
  const [estimateGas, setEstimateGas] = useState({ value: 0, loading: false, error: false });

  const currentSide = selectedBridgeSide ? bridgeAAs[selectedBridgeSide] : undefined;
  const factoryAddress = currentSide && assistantFactoryAAs[currentSide.network] && assistantFactoryAAs[currentSide.network][currentSide.type];

  useEffect(async () => {
    setEstimateGas({ value: 0, loading: true, error: false });
    try {
      const gas = await estimateGasForCreationAssistant(currentSide.network, currentSide.type);
      setEstimateGas({ value: gas, loading: false, error: false });
    } catch {
      setEstimateGas({ value: 0, loading: false, error: true });
    }
  }, [currentSide]);

  useEffect(async () => {
    if (manager.valid) {
      dispatch(setDestAddress({ address: manager.value, network: currentSide.network }));
      setSymbol({ value: `${currentSide.symbol}${currentSide.type === "import" ? "I" : "E"}A_${manager.value.replace("0x", "").slice(0, 3)}`.toUpperCase(), isTaken: null, isLoading: false, valid: true })
    } else {
      setSymbol({ value: "", valid: false, isTaken: null, isLoading: false })
    }
  }, [manager]);

  useEffect(async () => {
    if (selectedBridgeSide && currentSide && currentSide.type) {
      const initialParams = currentSide.type === "import" ? initialImportParams : initialExportParams;
      const params = {};
      Object.keys(initialParams).map(key => params[key] = { value: initialParams[key] * 100, valid: true });

      setCurrentParams(params);

      const stakeAsset = currentSide.type === "import" ? currentSide.stake_asset : currentSide.home_asset;
      const stakeNetwork = currentSide.type === "import" ? currentSide.foreign_network : currentSide.home_network;

      try {
        const stakeSymbol = await getSymbol(stakeAsset, stakeNetwork);
        setStakeSymbol(stakeSymbol);
      } catch {
        setStakeSymbol(null);
      }
    }
  }, [selectedBridgeSide]);


  const isValidManager = (value) => {
    if (!value)
      return undefined;

    if (currentSide.network === "Obyte") {
      return obyte.utils.isValidAddress(value);
    } else if (Object.keys(chainIds[environment]).includes(currentSide.network)) {
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

  const handleRecipientChange = (value) => {
    const valid = isValidManager(value);
    setManager({ value, valid });
  };

  const handleChangeParams = (name, value) => {
    const reg = /^[0-9.]+$/;

    if ((~(value + "").indexOf(".") ? (value + "").split(".")[1].length : 0) <= 2) {
      if (reg.test(String(value)) && !isNaN(Number(value)) && value <= 100) {
        setCurrentParams(p => ({ ...p, [name]: { value, valid: true } }))
      } else {
        setCurrentParams(p => ({ ...p, [name]: { value, valid: false } }))
      }
    }
  }

  const addCreateAssistantOrder = () => {
    const params = {};
    Object.keys(currentParams).forEach(p => params[p] = currentParams[p].value / 100)

    dispatch(addCreationOrder({
      orderType: "assistant",
      bridge_aa: currentSide?.bridge_aa,
      manager: manager.value,
      params,
      factoryAddress: factoryAddress,
      network: currentSide.network,
      shares_symbol: symbol.value,
      symbol: currentSide.symbol,
      author: addresses[currentSide.network] || null,
      type: currentSide.type
    }));
  }

  const paramsIsValid = currentParams ? (Object.keys(currentParams).findIndex((paramName) => !currentParams[paramName].valid) < 0) : false;

  const checkSharesSymbol = async () => {
    setSymbol(s => ({ ...s, isLoading: true }));
    if (currentSide.network === "Obyte" && symbol.value) {
      if ((`s2a_${symbol.value}` in tokenRegistryState) || symbol.value === "GBYTE") {
        setSymbol(s => ({ ...s, isTaken: true, isLoading: false }));
      } else {
        setSymbol(s => ({ ...s, isTaken: false, isLoading: false }));
      }
    } else if (currentSide.network !== "Obyte" && symbol.value) {
      setSymbol(s => ({ ...s, isTaken: sharesSymbols.includes(symbol.value), isLoading: false }));
    } else {
      setSymbol(s => ({ ...s, isTaken: true, isLoading: false }));
    }
  }

  if (sharesSymbols.length === 0) return "Loading..."

  return <div className="createAssistant">
    <Form layout="vertical">
      <Form.Item>
        <Select value={selectedBridgeSide} optionFilterProp="children" showSearch loading={Object.keys(bridgeAAs).length === 0} onChange={(value) => setSelectedBridgeSide(value)} style={{ width: "100%" }} size="middle" placeholder="Please select a bridge side">
          {list?.map((item) => <Select.OptGroup key={item.bridge_label + item.import + item.export} label={<b style={{ fontSize: 14 }}>{item.bridge_label}</b>}>
            <Option style={{ height: 45, display: "flex", alignItems: "center" }} value={item.export}>{bridgeAAs[item.export].symbol} on {bridgeAAs[item.export].network} ({bridgeAAs[item.export].type})</Option>
            <Option style={{ height: 45, display: "flex", alignItems: "center" }} value={item.import}>{bridgeAAs[item.import].symbol} on {bridgeAAs[item.import].network} ({bridgeAAs[item.import].type})</Option>
          </Select.OptGroup>)}
        </Select>
      </Form.Item>
      {currentSide && currentParams && <>
        <Form.Item hasFeedback={true} validateStatus={manager.value ? (manager.valid ? "success" : "error") : undefined} label={<span>Manager <InfoTooltip title="The pool’s manager who is responsible for claiming transfers and challenging fraudulent claims on behalf of the pool." /></span>} extra={<span>Address of your <a href="https://github.com/byteball/counterstake-bridge" target="_blank" rel="noopener">assistant bot</a>. Run the bot to learn its address.</span>}>
          <Input
            size="middle"
            className="evmHashOrAddress"
            spellCheck="false"
            value={manager.value}
            placeholder={`${currentSide.network} address`}
            onChange={(ev) => handleRecipientChange(ev.target.value)}
          />
        </Form.Item>

        <Form.Item label="Symbol" extra={symbol?.isTaken ? <div style={{ color: "red" }}>Symbol already taken</div> : (symbol?.isTaken === false && <div style={{ color: "green" }}>Symbol available</div>)}>
          <Input.Group compact>
            <Input placeholder="Symbol" style={{ width: 'calc(100% - 81px)' }} value={symbol?.value} onChange={(ev) => setSymbol({ value: String(ev.target.value).toUpperCase().trim(), valid: ev.target.value.length > 0, isTaken: null })} />
            <Button size="large" type="primary" onClick={checkSharesSymbol} disabled={!symbol.valid || symbol?.isLoading || symbol?.isTaken !== null}>Check</Button>
          </Input.Group>
        </Form.Item>

        <Row gutter={8}>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <Form.Item hasFeedback={true} validateStatus={currentParams.management_fee?.value ? (currentParams.management_fee.valid ? "success" : "error") : undefined} label={<span>Management fee <InfoTooltip title="Yearly fee charged by the manager for managing the pool." /></span>}>
              <Input placeholder="Management fee" suffix="%" value={currentParams.management_fee?.value} onChange={(ev) => handleChangeParams("management_fee", ev.target.value)} />
            </Form.Item>
          </Col>
          <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <Form.Item hasFeedback={true} validateStatus={currentParams.success_fee?.value ? (currentParams.success_fee.valid ? "success" : "error") : undefined} label={<span>Success fee <InfoTooltip title="Manager’s share of the pool’s profits." /></span>}>
              <Input placeholder="Success fee" suffix="%" value={currentParams.success_fee?.value} onChange={(ev) => handleChangeParams("success_fee", ev.target.value)} />
            </Form.Item>
          </Col>

          {currentSide.type === "import" && <Col md={{ span: 8 }} sm={{ span: 16 }} xs={{ span: 24 }}>
            <Form.Item hasFeedback={true} validateStatus={currentParams.swap_fee?.value ? (currentParams.swap_fee.valid ? "success" : "error") : undefined} label={<span>Swap fee <InfoTooltip title={`Fee charged when swapping between ${currentSide.symbol} and ${stakeSymbol || "stake asset"} in the pool`} /></span>}>
              <Input placeholder="Swap fee" suffix="%" value={currentParams.swap_fee?.value} onChange={(ev) => handleChangeParams("swap_fee", ev.target.value)} />
            </Form.Item>
          </Col>}
        </Row>

        {currentSide.network !== "Obyte" && <Row style={{ color: "#faad14" }}>
          {!estimateGas.loading ? <div style={{ marginBottom: 20 }}>
            Estimated gas cost: ${Number(estimateGas.value).toFixed(2)}. After you create the assistant, please make sure that {currentSide?.symbol} users know about its existence and add liquidity to it.
          </div> : <div style={{ marginBottom: 20 }}>Calculate the estimated cost of gas...</div>}
        </Row>}


        <Form.Item>
          <Button type="primary" disabled={!paramsIsValid || !manager.valid || symbol?.isTaken === true || symbol?.isTaken === null} onClick={addCreateAssistantOrder}>Create</Button>
        </Form.Item>
      </>}
    </Form>
  </div>
}