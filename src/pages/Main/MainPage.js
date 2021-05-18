import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Col, Row, Button, Select, Form, Input, Typography } from "antd";
import { ArrowRightOutlined, ArrowDownOutlined } from "@ant-design/icons";
import ReactGA from "react-ga";
import obyte from "obyte";
import { ethers } from "ethers";

import { useSelector, useDispatch } from 'react-redux';
import QRButton from "obyte-qr-button";

import { selectTransfers, addTransfer, updateTransferStatus } from "store/transfersSlice";
import { selectDestAddress, setDestAddress } from "store/destAddressSlice";
import { selectDirections, setDirections } from "store/directionsSlice";
import styles from "./MainPage.module.css";
import { getBridges } from "services/api";
import { sendTransferToGA } from "services/transfer";
import { startWatchingSourceBridge, startWatchingDestinationBridge } from "services/watch";
import { useWindowSize } from "hooks/useWindowSize";
import { generateLink } from "utils/generateLink";
import { ReactComponent as MetamaskLogo } from "./metamask-fox.svg";

const { Title, Paragraph, Text } = Typography;

const exportAbi = [
  "function transferToForeignChain(string memory foreign_address, string memory data, uint amount, int reward) payable"
];

const importAbi = [
  "function transferToHomeChain(string memory home_address, string memory data, uint amount, uint reward)"
];

const erc20Abi = [
  "function allowance(address owner, address spender) public view virtual override returns (uint256)",
  "function approve(address spender, uint256 amount) public virtual override returns (bool)",
  "function balanceOf(address account) public view virtual override returns (uint256)",
];

const chainIds = {
  mainnet: {
    Ethereum: 1,
    BSC: 56,
  },
  testnet: {
    Ethereum: 4, // rinkeby
    BSC: 97,
  },
  devnet: {
    Ethereum: 1337, // ganache
    BSC: null,
  },
};
const environment = process.env.REACT_APP_ENVIRONMENT;


const MAX_UINT256 = ethers.BigNumber.from(2).pow(256).sub(1);


const tokensEqual = (t1, t2) => t1.asset === t2.asset && t1.network === t2.network;

function getOrInsertInput(inputs, token) {
  for (let input of inputs)
    if (tokensEqual(input.token, token))
      return input;
  const new_input = { token, destinations: [] };
  inputs.push(new_input);
  return new_input;
}

export const MainPage = () => {

  const [width] = useWindowSize();
  let [inputs, setInputs] = useState();
  let [selectedInput, setSelectedInput] = useState();
  let [selectedDestination, setSelectedDestination] = useState();
  let [counter, setCounter] = useState(0);
  const [amountIn, setAmountIn] = useState();
  const [amountOut, setAmountOut] = useState();
  const [reward, setReward] = useState(0);
  const [countAssistants, setCountAssistants] = useState(0);
  const [recipient, setRecipient] = useState({});
  const [error, setError] = useState();

  const dispatch = useDispatch();
  const transfers = useSelector(selectTransfers);

  useEffect(() => {
    const updateBridges = async () => {
      const resp = await getBridges();
      if (resp.status !== 'success')
        return;
      const bridges = resp.data;
      let directions = {};
      let inputs = [];
      for (let { bridge_id, home_network, home_asset, home_asset_decimals, home_symbol, export_aa, foreign_network, foreign_asset, foreign_asset_decimals, foreign_symbol, import_aa, min_expatriation_reward, min_repatriation_reward, count_expatriation_claimants, count_repatriation_claimants } of bridges) {
        const home_token = { network: home_network, asset: home_asset, decimals: home_asset_decimals, symbol: home_symbol, bridge_aa: export_aa };
        const foreign_token = { network: foreign_network, asset: foreign_asset, decimals: foreign_asset_decimals, symbol: foreign_symbol, bridge_aa: import_aa };
        directions[export_aa] = {
          bridge_id,
          type: 'expatriation',
          src_token: home_token,
          dst_token: foreign_token,
        };
        directions[import_aa] = {
          bridge_id,
          type: 'repatriation',
          src_token: foreign_token,
          dst_token: home_token,
        };
        const home_input = getOrInsertInput(inputs, home_token);
        home_input.destinations.push({ bridge_id, type: 'expatriation', min_reward: min_expatriation_reward, count_claimants: count_expatriation_claimants, token: foreign_token });
        const foreign_input = getOrInsertInput(inputs, foreign_token);
        foreign_input.destinations.push({ bridge_id, type: 'repatriation', min_reward: min_repatriation_reward, count_claimants: count_repatriation_claimants, token: home_token });
      }
      console.log('inputs', inputs)
      setInputs(inputs);
      dispatch(setDirections(directions));
    };
    updateBridges();
  }, [counter]);

  const transferRef = useRef(null);

  const handleAmountIn = (ev) => {
    const value = ev.target.value;
    const reg = /^[0-9.]+$/;
    if (reg.test(String(value)) || value === "") {
      setAmountIn(value);
    }
  };

  const isValidRecipient = value => {
    console.log(value, selectedDestination)
    if (!selectedDestination || !value)
      return undefined;
    switch (selectedDestination.token.network) {
      case 'Obyte':
        return obyte.utils.isValidAddress(value);
      case 'Ethereum':
      case 'BSC':
        return ethers.utils.isAddress(value);
      default: throw Error(`unknown network ${selectedDestination.token.network}`);
    }
  };

  const handleRecipientChange = (value) => {
    const valid = isValidRecipient(value);
    setRecipient({ value, valid });
  };

  const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
  const signer = window.ethereum && provider.getSigner();

  const insertRecipientAddress = async () => {
    if (!window.ethereum)
      return console.log('metamask not found');
    const accounts = await provider.listAccounts();
    console.log('accounts', accounts);
    if (accounts.length === 0)
      return console.log('no accounts yet');
    const value = await signer.getAddress();
    setRecipient({ value, valid: isValidRecipient(value) });
  };

  useEffect(() => {
    let value = recipient.value;
    const valid = isValidRecipient(value);
    setRecipient({ value, valid });
    if (selectedDestination && selectedDestination.token.network !== 'Obyte' && !valid)
      insertRecipientAddress();
  }, [selectedDestination]);

  useEffect(() => {
    console.log('setDestAddress', recipient)
    if (recipient.valid)
      dispatch(setDestAddress(recipient.value));
  }, [recipient])

  useEffect(() => {
    if (selectedDestination)
      setCountAssistants(selectedDestination.count_claimants);
    if (!amountIn) {
      setAmountOut(undefined);
      setReward(undefined);
      return;
    }
    let reward = amountIn * 0.01;
    if (selectedInput && selectedDestination) {
      reward += selectedDestination.min_reward * 1.5;
    }
    let amount_out = amountIn - reward;
    if (selectedDestination)
      amount_out = +amount_out.toFixed(selectedDestination.token.decimals);
    console.log({amountIn, amount_out, reward})
    setAmountOut(amount_out);
    setReward(reward);
    if (selectedDestination && selectedInput.token.network === 'Obyte') {
      // start watching selectedInput.token.bridge_aa (if not already watching) to learn when a new transfer from Obyte is sent
      startWatchingSourceBridge(selectedInput.token);
    }
  }, [selectedDestination, amountIn]);


  const loginEthereum = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  };


  const handleClickTransfer = async () => {
    if (selectedInput.token.network === 'Obyte')
      throw Error(`handleClickTransfer called for Obyte`);
    // Ethereum or BSC
    if (!window.ethereum)
      return setError("MetaMask not found");
    await loginEthereum();
    console.log({ amountIn, reward, amountOut });
    const network = await provider.getNetwork();
    if (network.chainId !== chainIds[environment][selectedInput.token.network])
      return setError(`Wrong network selected, please select ${selectedInput.token.network} in MetaMask`);
    const bnAmount = ethers.utils.parseUnits(amountIn, selectedInput.token.decimals);
    const bnReward = ethers.utils.parseUnits(reward + '', selectedInput.token.decimals);
    const sender_address = await signer.getAddress();
    const dest_address = recipient.value;
    let res;
    if (selectedDestination.type === 'expatriation') {
      const isETH = selectedInput.token.asset === ethers.constants.AddressZero;
      if (!isETH) { // check allowance
        const tokenContract = new ethers.Contract(selectedInput.token.asset, erc20Abi, signer);
        const allowance = await tokenContract.allowance(sender_address, selectedInput.token.bridge_aa);
        console.log('allowance', allowance.toString());
        if (allowance.lt(bnAmount)) {
          console.log('requesting approval');
          const approval_res = await tokenContract.approve(selectedInput.token.bridge_aa, MAX_UINT256);
          console.log('approval_res', approval_res);
        }
      }
      const contract = new ethers.Contract(selectedInput.token.bridge_aa, exportAbi, signer);
      res = await contract.transferToForeignChain(dest_address, '', bnAmount, bnReward, {value: isETH ? bnAmount : 0});
    }
    else { // repatriation
      const contract = new ethers.Contract(selectedInput.token.bridge_aa, importAbi, signer);
      res = await contract.transferToHomeChain(dest_address, '', bnAmount, bnReward);
    }
    console.log('res', res);
    sendTransferToGA(selectedInput.token, selectedDestination.token);
    const transfer = {
      src_token: selectedInput.token,
      dst_token: selectedDestination.token,
      amount: amountIn,
      reward,
      sender_address,
      dest_address,
      txid: res.hash,
      status: 'sent',
      ts: Date.now(),
    };
    dispatch(addTransfer(transfer));

    // start watching selectedDestination.token.bridge_aa on Obyte side
    startWatchingDestinationBridge(selectedDestination.token);

    // wait until mined
    const receipt = await res.wait();
    console.log('tx mined, receipt', receipt);
    dispatch(updateTransferStatus({ txid: res.hash, status: 'mined' }));
  };

  

  return (
    <div className={styles.container}>
      <Helmet title="Counterstake Bridge" />
      <Title level={1}>Counterstake Bridge :alpha:</Title>
      <Paragraph>This is new, untested, unaudited software, use with care.</Paragraph>

      
      <Row style={{ marginTop: 20 }}>
        <Col xs={{ span: 24, offset: 0 }} md={{ span: 11 }}>
          
          <div style={{ marginBottom: 5 }}>
            <Text type="secondary">
              You <b>send</b>
            </Text>
          </div>

          <Input.Group compact>
            <Input
              style={{ width: "50%" }}
              size="large"
              placeholder="Amount"
              onChange={handleAmountIn}
              value={isNaN(amountIn) ? undefined : amountIn}
              onKeyPress={(ev) => {
                if (ev.key === "Enter") {
                  transferRef.current.click();
                }
              }}
            />
            <Select
              style={{ width: "50%" }}
              size="large"
              showSearch
              placeholder="Input currency and network"
              onChange={index => {
                console.log({index})
                setSelectedInput(inputs[index]);
                setSelectedDestination(inputs[index].destinations[0])
              }}
              //value={selectedInput}
            >
              {inputs && inputs.map((input, index) => (
                <Select.Option key={index} value={index}>
                  {input.token.symbol} on {input.token.network}
                </Select.Option>
              ))}{" "}
            </Select>
          </Input.Group>

        </Col>

        <Col xs={{ span: 24, offset: 0 }} md={{ span: 2, offset: 0 }}>
          <div
            style={{
              marginTop: width < 768 ? 10 : 27,
              textAlign: "center",
              height: 38,
              boxSizing: "border-box",
              fontSize: "1.5em",
            }}
          >
            {width < 768 ? <ArrowDownOutlined /> : <ArrowRightOutlined />}
          </div>
        </Col>

        <Col xs={{ span: 24, offset: 0 }} md={{ span: 11, offset: 0 }}>
          
          <div style={{ marginBottom: 5 }}>
            <Text type="secondary">
              You <b>get</b>
            </Text>
          </div>

          <Input.Group compact>
            <Input
              style={{ width: "50%" }}
              size="large"
              placeholder="Amount to receive"
              value={isNaN(amountOut) ? undefined : amountOut}
              disabled={true}
              onKeyPress={(ev) => {
                if (ev.key === "Enter") {
                  transferRef.current.click();
                }
              }}
            />
            <Select
              style={{ width: "50%" }}
              size="large"
              showSearch
              optionFilterProp="children"
              placeholder="Token to receive"
              onChange={index => setSelectedDestination(selectedInput.destinations[index])}
              value={selectedInput && selectedDestination && selectedInput.destinations.indexOf(selectedDestination)}
            >
              {selectedInput && selectedInput.destinations.map((destination, index) => (
                <Select.Option key={index} value={index}>
                  {destination.token.symbol} on {destination.token.network}{" "}
                </Select.Option>
              ))}
            </Select>
          </Input.Group>
          <span style={{ fontSize: 12 }}>Assistant reward: {reward ? +reward.toPrecision(4) : 0} {selectedDestination && selectedDestination.token.symbol}{selectedDestination && `. Active assistants: ${countAssistants}.`}</span>

          <Form.Item
            hasFeedback
            style={{ width: "100%", marginTop: 20 }}
            extra={selectedDestination && selectedDestination.token.network === 'Obyte' &&
              <span>
                <a
                  href="https://obyte.org/#download"
                  target="_blank"
                  rel="noopener"
                  onClick={
                    () => {
                      ReactGA.event({
                        category: "Transfer",
                        action: "Install wallet",
                        label: selectedInput.token.symbol + ' ' + selectedInput.token.network
                      })
                    }
                  }>Install Obyte wallet</a> if you don't have one yet, and copy/paste your address here.
              </span>
            }
            validateStatus={
              recipient.valid !== undefined
                ? recipient.valid
                  ? "success"
                  : "error"
                : undefined
            }
          >
            <Input
              size="large"
              value={recipient.value}
              placeholder={`Your ${selectedDestination ? selectedDestination.token.network : 'receiving'} wallet address`}
              prefix={selectedDestination && selectedDestination.token.network !== 'Obyte' &&
                <MetamaskLogo
                  style={{cursor: "pointer", marginRight: 5}}
                  onClick={async () => {
                    if (!window.ethereum)
                      return alert('Metamask not found');
                    await loginEthereum();
                    await insertRecipientAddress();
                  }}
                />}
              onChange={(ev) => handleRecipientChange(ev.target.value)}
            />
          </Form.Item>
          
        </Col>
      </Row>

      <Row justify="center">
        {selectedInput && selectedInput.token.network === 'Obyte' ? <QRButton
          type="primary"
          size="large"
          ref={transferRef}
          loading={!inputs}
          key="btn-transfer"
          disabled={
            !recipient.valid ||
            !amountIn ||
            !(amountOut > 0)
          }
          href={generateLink({
            amount: amountIn * 10 ** selectedInput.token.decimals,
            aa: selectedInput.token.bridge_aa,
            asset: selectedInput.token.asset,
            data: {
              reward: Math.round(reward * 10 ** selectedInput.token.decimals),
              [selectedDestination.type === 'expatriation' ? 'foreign_address' : 'home_address']: recipient.value
            }
          })}
        >
          Transfer
        </QRButton> : <Button
          type="primary"
          size="large"
          ref={transferRef}
          loading={!inputs}
          key="btn-transfer"
          disabled={
            !recipient.valid ||
            !amountIn ||
            !(amountOut > 0)
          }
          onClick={handleClickTransfer}
        >
          Transfer
        </Button>}
      </Row>
      {error &&
        <Row justify="center" style={{marginTop: 10}}>
          <Text type="secondary" style={{ fontSize: 12, color: "red" }}>{ error }</Text>
        </Row>
      }

      {
        // todo: display a list of transfers that are not finished yet (if any) and their progress
        // one line per transfer, e.g. sent -> mined -> received, highlight the stages that have already been completed
        transfers.map(t => <Row key={t.txid}>{t.amount} {t.src_token.symbol}: {t.src_token.network} -&gt; {t.dst_token.network} {t.status}</Row>)
      }


      <Paragraph style={{fontSize: 11, marginTop: 40}}>Counterstake is a fully decentralized cross-chain transfer protocol. There are no admins, no central operators, no owners, no custodians. Participation in the protocol is open, there are no designated multisig participants, federated signers, or threshold signatures. All transfers are direct, there are no central hubs. No token is required to use the protocol. There are no protocol fees. The code is immutable, not upgradable, unstoppable. There are no access controls, no gatekeepers, no KYC, no your customer.</Paragraph>

    </div>
  );
};
