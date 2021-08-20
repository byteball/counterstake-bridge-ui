import React, { useState, useRef, useEffect } from "react";
import { Modal, Form, Input, Button, Space, Typography, Select, Row, Col, message, Alert, Tooltip } from "antd";
import obyte from "obyte";
import { useDispatch } from "react-redux";
import QRButton from "obyte-qr-button";

import socket from "services/socket";
import { generateLink } from "utils";
import { EVMBridgeGovernance } from "pages/Governance/utils/EVMBridgeGovernance";
import { getParameterList } from "pages/Governance/utils/getParameterList";
import { updateActiveGovernanceAA } from "store/thunks/updateActiveGovernanceAA";
import { ChangeAddressModal } from "./ChangeAddressModal";

const { Text, Paragraph } = Typography;

export const ChangeParamsModal = ({ supportValue, description, name, activeGovernance, bridge_network, bridge_decimals, voteTokenAddress, voteTokenDecimals, voteTokenSymbol, stakeTokenDecimals, balance = 0, active, isMyChoice, activeWallet, disabled }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [oracles, setOracles] = useState({});
  const [checkedOracle, setCheckedOracle] = useState(undefined);
  const btnRef = useRef();
  const dispatch = useDispatch();

  const [paramValue, setParamValue] = useState({
    value: undefined,
    valid: false,
  });

  const [amount, setAmount] = useState({
    value: undefined,
    valid: false,
  });

  const parameterList = getParameterList(bridge_network);
  const parameterInfo = parameterList?.[name];

  useEffect(() => {
    if (name === "oracles" && oracles) {
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
      if (oraclesArray.length > 0) {
        setParamValue({
          value: oraclesArray.join(" "),
          valid: true
        });
      } else {
        setParamValue({
          value: "",
          valid: true
        });
      }

    };
  }, [name, oracles]);

  const vote = async () => {
    if (bridge_network === "Obyte") return;
    try {

      const EVM = new EVMBridgeGovernance(bridge_network, active, voteTokenDecimals, activeWallet, stakeTokenDecimals);
      await EVM.changeParam(name, paramValue.value, amount.valid ? amount.value : undefined, () => {
        handleCancel();
        dispatch(updateActiveGovernanceAA())
      });

    } catch (e) {
      console.log("change param error", e);
    }
  }

  useEffect(() => {
    const getStatusOracle = async () => {
      const {
        oracle1,
        feed_name1,
        op1,
        oracle2,
        feed_name2,
        op2,
        oracle3,
        feed_name3,
        op3,
      } = oracles;

      if (oracle1 && feed_name1 && op1) {
        try {
          const data_feed = await socket.api.getDataFeed({
            oracles: [oracle1],
            feed_name: feed_name1,
            ifnone: "none",
          });
          if (data_feed !== "none") {
            setCheckedOracle(true);
          } else {
            message.error("Oracle 1 is not active!");
            setCheckedOracle(null);
          }
        } catch (e) {
          setCheckedOracle(null);
          message.error("Oracle 1 is not found!");
          console.log("error", e);
        }
      } else {
        message.error("Not all data for oracle 1 is specified!");
        setCheckedOracle(null);
      }

      if (oracle2 || feed_name2) {
        if (op2) {
          try {
            const data_feed = await socket.api.getDataFeed({
              oracles: [oracle2],
              feed_name: feed_name2,
              ifnone: "none",
            });
            if (data_feed !== "none") {
              setCheckedOracle(true);
            } else {
              message.error("Oracle 2 is not active!");
              setCheckedOracle(null);
            }
          } catch (e) {
            setCheckedOracle(null);
            message.error("Oracle 2 is not found!");
            console.log("error", e);
          }
        } else {
          message.error("Not all data for oracle 2 is specified!");
          setCheckedOracle(null);
        }
      }

      if (oracle3 || feed_name3) {
        if (op3) {
          try {
            const data_feed = await socket.api.getDataFeed({
              oracles: [oracle3],
              feed_name: feed_name3,
              ifnone: "none",
            });
            if (data_feed !== "none") {
              setCheckedOracle(true);
            } else {
              message.error("Oracle 3 is not active!");
              setCheckedOracle(null);
            }
          } catch (e) {
            setCheckedOracle(null);
            message.error("Oracle is not found!");
            console.log("error", e);
          }
        } else {
          message.error("Not all data for oracle 3 is specified!");
          setCheckedOracle(null);
        }
      }
    };

    if (checkedOracle === false && bridge_network === "Obyte") {
      getStatusOracle();
    }
  }, [checkedOracle]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleChangeParamValue = (ev) => {
    const value = ev.target.value;
    let reg;

    if (name === "challenging_periods" || name === "large_challenging_periods") {
      reg = /^[0-9 .]+$/;
    } else {
      reg = /^(0|[.1-9]\d*)([.,]\d+)?$/;
    }
    if (value === "") {
      setParamValue({ value: undefined, valid: false });
    } else if (
      (reg.test(String(value)) || name === "oracles") &&
      parameterInfo.validator(value)
    ) {
      setParamValue({ value, valid: true });
    } else {
      setParamValue({ value, valid: false });
    }
  };

  const handleChangeAmount = (ev) => {
    const value = ev.target.value;
    const reg = /^[0-9.]+$/;

    if (value === "" || value === "0") {
      setAmount({ value, valid: undefined });
    } else {
      if (
        (~(value + "").indexOf(".") ? (value + "").split(".")[1].length : 0) <=
        voteTokenDecimals
      ) {
        if (reg.test(String(value))) {
          setAmount({ value, valid: true });
        } else {
          setAmount({ value, valid: false });
        }
      }
    }
  };
  
  useEffect(() => {
    let transformedValue;
    if (supportValue !== undefined && bridge_network !== "Obyte" && (name === "ratio" || name === "counterstake_coef")) {
      transformedValue = supportValue / 100
    } else if (supportValue !== undefined && (name === "large_threshold" || name === "min_stake")) {
      transformedValue = supportValue / 10 ** stakeTokenDecimals
    } else if (supportValue !== undefined && bridge_network !== "Obyte" && name === "min_price") {
      transformedValue = supportValue / 1e20
    } else {
      transformedValue = supportValue
    }
    console.log("stakeTokenDecimals", supportValue, stakeTokenDecimals, transformedValue)
    setParamValue({
      value: transformedValue,
      valid: supportValue !== undefined
    });

    setAmount({
      value: undefined,
      valid: false,
    });

    setOracles({})
    setCheckedOracle(undefined)
  }, [isModalVisible]);

  if (!name) return null;

  let sendValue;
  if (name === "min_stake" || name === "large_threshold") {
    sendValue = Number(paramValue.value).toFixed(stakeTokenDecimals) * 10 ** stakeTokenDecimals
  } else {
    sendValue = paramValue.value;
  }

  const link = bridge_network === "Obyte" ? generateLink({
    amount: amount.valid ? Math.ceil(amount.value * 10 ** voteTokenDecimals) : 1e4,
    asset: amount.valid ? voteTokenAddress : undefined,
    data: {
      name,
      value: sendValue
    },
    aa: activeGovernance,
    from_address: activeWallet,
    is_single: true
  }) : undefined;

  const finalSupport = Number(balance) + (amount.valid ? Number(amount.value * 10 ** voteTokenDecimals) : 0);

  const handleKeyPress = (ev) => {
    if (ev.key === "Enter") {
      if (finalSupport !== 0 && paramValue.valid) {
        btnRef.current.click();
      }
    }
  }

  const handleChangeOracles = (name, value) => {
    setOracles((o) => ({ ...o, [name]: value }))
  }

  return (
    <>
      {!activeWallet ? <Tooltip zIndex={99} title={<div>
        Please <ChangeAddressModal network={bridge_network}>add your address</ChangeAddressModal> first
      </div>}>
        <Text disabled>{supportValue !== undefined ? (isMyChoice ? "add support for this value" : "vote for this value") : "suggest another value"}</Text>
      </Tooltip> : <Button type="link" style={{ padding: 0, height: "auto" }} disabled={disabled} onClick={showModal}>
        {supportValue !== undefined ? (isMyChoice ? "add support for this value" : "vote for this value") : "suggest another value"}
      </Button>}
      <Modal destroyOnClose width={700} title={`Change ${name.split("_").join(" ")}`} visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}
        footer={
          <Space>
            <Button key="Cancel" onClick={handleCancel}>Close</Button>
            {bridge_network === "Obyte" ? <>
              {name === "oracles" && !checkedOracle && !supportValue ? <Button
                key="check"
                type="primary"
                ref={btnRef}
                onClick={() => setCheckedOracle(false)}
              >
                Check
              </Button> : <QRButton
                key="submit"
                type="primary"
                href={link}
                style={{ margin: 0 }}
                disabled={
                  paramValue.value === undefined || paramValue.value === "" || !paramValue.valid || (isMyChoice
                    ? Number(amount.value) === 0 || !amount.valid
                    : finalSupport === 0 || !paramValue.valid)
                }
                onClick={() =>
                  setTimeout(() => {
                    handleCancel();
                  }, 100)
                }
              >
                {isMyChoice ? "Add support" : "Vote"}
              </QRButton>}
            </> : <Button
              key="check"
              type="primary"
              ref={btnRef}
              disabled={
                paramValue.value === undefined || paramValue.value === "" || paramValue.valid === undefined || !paramValue.valid || (isMyChoice
                  ? Number(amount.value) === 0 || !amount.valid
                  : finalSupport === 0 || !paramValue.valid)
              }
              onClick={vote}>Vote</Button>}
          </Space>
        }
      >
        {description && <Alert style={{ marginBottom: 15 }} message={description} type="info" showIcon />}
        <Form size="middle" layout="vertical">
          <Text type="secondary">Parameter value:</Text>
          {(!(name === "oracles" && bridge_network === "Obyte")) ? <Form.Item
            hasFeedback
            validateStatus={((!paramValue.valid && paramValue.value !== undefined)) ? "error" : undefined}
            help={((!paramValue.valid && paramValue.value !== undefined)) ? parameterInfo.rule : undefined}
          >
            <Input
              placeholder={name.split("_").join(" ")}
              autoComplete="off"
              className={name === "oracles" ? "evmHashOrAddress" : ""}
              spellCheck="false"
              autoFocus={supportValue === undefined}
              disabled={supportValue !== undefined}
              onChange={handleChangeParamValue}
              value={paramValue.value}
              onKeyPress={handleKeyPress}
            />
          </Form.Item> : (
            supportValue !== undefined ? <Paragraph>
              {supportValue}
            </Paragraph> : <div>
              <Row>
                <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 11 }}>
                  <Form.Item>
                    <Input
                      placeholder="Oracle 1"
                      autoComplete="off"
                      disabled={checkedOracle === true}
                      style={{ width: "100%" }}
                      value={oracles.oracle1}
                      onChange={(ev) => handleChangeOracles("oracle1", ev.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 7, offset: 1 }}>
                  <Form.Item>
                    <Input
                      placeholder="Feed name 1"
                      autoComplete="off"
                      disabled={checkedOracle === true}
                      value={oracles.feed_name1}
                      onChange={(ev) => handleChangeOracles("feed_name1", ev.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 4, offset: 1 }}>
                  <Form.Item>
                    <Select
                      placeholder="Operation 1"
                      disabled={checkedOracle === true}
                      style={{ width: "100%" }}
                      value={oracles.op1}
                      onChange={(value) => handleChangeOracles("op1", value)}
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
                    <Input
                      placeholder="Oracle 2"
                      autoComplete="off"
                      disabled={checkedOracle === true}
                      style={{ width: "100%" }}
                      value={oracles.oracle2}
                      onChange={(ev) => handleChangeOracles("oracle2", ev.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 7, offset: 1 }}>
                  <Form.Item>
                    <Input
                      placeholder="Feed name 2"
                      autoComplete="off"
                      disabled={checkedOracle === true}
                      value={oracles.feed_name2}
                      onChange={(ev) => handleChangeOracles("feed_name2", ev.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 4, offset: 1 }}>
                  <Form.Item>
                    <Select
                      placeholder="Operation 2"
                      disabled={checkedOracle === true}
                      style={{ width: "100%" }}
                      value={oracles.op2}
                      onChange={(value) => handleChangeOracles("op2", value)}
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
                    <Input
                      placeholder="Oracle 3"
                      autoComplete="off"
                      disabled={checkedOracle === true}
                      style={{ width: "100%" }}
                      value={oracles.oracle3}
                      onChange={(ev) => handleChangeOracles("oracle3", ev.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 7, offset: 1 }}>
                  <Form.Item>
                    <Input
                      placeholder="Feed name 3"
                      autoComplete="off"
                      disabled={checkedOracle === true}
                      value={oracles.feed_name3}
                      onChange={(ev) => handleChangeOracles("feed_name3", ev.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col sm={{ span: 24 }} xs={{ span: 24 }} md={{ span: 4, offset: 1 }}>
                  <Form.Item>
                    <Select
                      placeholder="Operation 3"
                      disabled={checkedOracle === true}
                      style={{ width: "100%" }}
                      value={oracles.op3}
                      onChange={(value) => handleChangeOracles("op3", value)}
                    >
                      <Select.Option value={"*"}>*</Select.Option>
                      <Select.Option value={"/"}>/</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>)}
          {balance !== 0 && balance !== "0" ? <Text type="secondary">Add more funds (optional):</Text> : <Text>Amount to vote with</Text>}
          <Form.Item>
            <Input
              placeholder={`Amount in ${voteTokenSymbol || "TOKEN"}`}
              autoComplete="off"
              onChange={handleChangeAmount}
              suffix={voteTokenSymbol || "TOKEN"}
              autoFocus={supportValue !== undefined}
              value={amount.value}
              onKeyPress={handleKeyPress}
            />
          </Form.Item>
        </Form>

        <Paragraph>
          <Text type="secondary">
            <b>Your balance: </b>
            {+Number(balance / 10 ** voteTokenDecimals).toFixed(voteTokenDecimals)} {voteTokenSymbol || "TOKEN"}
          </Text>
        </Paragraph>
        <Paragraph>
          <Text type="secondary">
            <b>Final support: </b>
            {+Number(finalSupport / 10 ** voteTokenDecimals).toFixed(voteTokenDecimals)} {voteTokenSymbol || "TOKEN"}
          </Text>
        </Paragraph>
        <Paragraph type="warning">
          Your funds will be locked on the governance {bridge_network === "Obyte" ? "AA" : "contract"} and you'll be able to withdraw them after 10-day challenging period and 30-day freeze period expire.
        </Paragraph>
      </Modal>
    </>
  );
};