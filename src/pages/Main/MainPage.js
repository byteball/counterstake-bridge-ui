import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Col, Row, Button, Select, Form, Input, Typography, message } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import ReactGA from "react-ga";
import obyte from "obyte";
import { ethers } from "ethers";
import { useSelector, useDispatch } from 'react-redux';
import QRButton from "obyte-qr-button";

import { addTransfer, updateTransferStatus } from "store/transfersSlice";
import { selectDestAddress, setDestAddress } from "store/destAddressSlice";

import { sendTransferToGA } from "services/transfer";
import { startWatchingSourceBridge, startWatchingDestinationBridge } from "services/watch";
import { useWindowSize } from "hooks/useWindowSize";
import { generateLink } from "utils/generateLink";
import { ReactComponent as MetamaskLogo } from "./metamask-fox.svg";
import { TransferList } from "components/TransferList/TransferList";
import { getPersist } from "store";
import { getCoinIcons, updateBridges, updateTransfersStatus } from "store/thunks";
import { getCoinIcon } from "./getCoinIcon";
import { selectConnectionStatus } from "store/connectionSlice";
import { selectInputs } from "store/inputsSlice";

import styles from "./MainPage.module.css";
import { addTokenToTracked, selectAddedTokens } from "store/addedTokensSlice";

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

const metamaskDownloadUrl = "https://metamask.io/download";

export const MainPage = () => {
  const [width] = useWindowSize();
  const { inputs, loaded } = useSelector(selectInputs)
  let [selectedInput, setSelectedInput] = useState();
  let [selectedDestination, setSelectedDestination] = useState();
  const [amountIn, setAmountIn] = useState(0.1);
  const [amountOut, setAmountOut] = useState();
  const [reward, setReward] = useState(0);
  const [countAssistants, setCountAssistants] = useState(0);
  const [recipient, setRecipient] = useState({});
  const [error, setError] = useState();
  const [tokenIsInitialized, setTokenIsInitialized] = useState(false)
  const dispatch = useDispatch();
  const { rehydrated } = useSelector(getPersist);
  const addresses = useSelector(selectDestAddress);
  const isOpenConnection = useSelector(selectConnectionStatus)
  const searchInputInRef = useRef(null);
  const searchInputOutRef = useRef(null);
  const [chainId, setChainId] = useState();
  const [inFocus, setInFocus] = useState(true);
  const [pendingTokens, setPendingTokens] = useState({});
  const addedTokens = useSelector(selectAddedTokens);
  const max_amount = selectedDestination && selectedDestination.max_amount && (selectedDestination.max_amount.toPrecision(4)) || 0;

  useEffect(() => {
    if (rehydrated && isOpenConnection) {
      dispatch(updateTransfersStatus());
    }
  }, [rehydrated, isOpenConnection])

  useEffect(() => {
    dispatch(getCoinIcons())
  }, []);

  useEffect(() => {
    dispatch(updateBridges());

    const intervalId = setInterval(() => { dispatch(updateBridges()) }, 1000 * 60 * 5);

    return () => {
      clearInterval(intervalId)
    }

  }, []);

  const transferRef = useRef(null);

  const handleAmountIn = (ev) => {
    const value = ev.target.value;
    const reg = /^[0-9.]+$/;
    if (reg.test(String(value)) || value === "") {
      setAmountIn(value);
    }
  };

  const isValidRecipient = value => {
    if (!selectedDestination || !value)
      return undefined;
    switch (selectedDestination.token.network) {
      case 'Obyte':
        return obyte.utils.isValidAddress(value);
      case 'Ethereum':
      case 'BSC':
        try {
          return ethers.utils.getAddress(value) === value;
        }
        catch (e) {
          return false;
        }
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
      return setRecipient({})
    const accounts = await provider.listAccounts();

    if (accounts.length === 0)
      return console.log('no accounts yet');
    const value = await signer.getAddress();
    setRecipient({ value, valid: isValidRecipient(value) });
  };

  useEffect(() => {
    window.addEventListener('focus', () => {
      setInFocus(true);
    });

    window.addEventListener('blur', () => {
      setInFocus(false);
    });
  }, []);

  useEffect(() => {
    const network = selectedDestination?.token?.network;
    if (network) {
      const value = addresses[network];
      if (value) {
        const valid = isValidRecipient(value);
        setRecipient({ value, valid });
      } else if (selectedDestination.token.network !== 'Obyte') {
        insertRecipientAddress();
      } else {
        setRecipient({});
      }
    }
  }, [selectedDestination]);

  useEffect(() => {
    if (recipient.valid)
      dispatch(setDestAddress({ address: recipient.value, network: selectedDestination.token.network }));
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
    setAmountOut(amount_out);
    setReward(reward);
    if (selectedDestination && selectedInput.token.network === 'Obyte') {
      // start watching src_bridge_aa (if not already watching) to learn when a new transfer from Obyte is sent
      startWatchingSourceBridge(selectedInput.token.network, selectedDestination.src_bridge_aa);
    }
  }, [selectedDestination, amountIn, isOpenConnection]);


  const loginEthereum = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  };


  const handleClickTransfer = async () => {
    if (selectedInput.token.network === 'Obyte')
      throw Error(`handleClickTransfer called for Obyte`);
    // Ethereum or BSC
    if (!window.ethereum)
      return setError(<>MetaMask not found. You can download it <a target="_blank" rel="noopener" href={metamaskDownloadUrl}>here</a>.</>);
    await loginEthereum();
    // do not exceed the precision of the least precise token, otherwise the money will be lost!
    const min_decimals = Math.min(selectedInput.token.decimals, selectedDestination.token.decimals);
    const bnAmount = ethers.utils.parseUnits(Number(amountIn).toFixed(min_decimals), selectedInput.token.decimals);
    const bnReward = ethers.utils.parseUnits(Number(reward).toFixed(min_decimals), selectedInput.token.decimals);
    const sender_address = await signer.getAddress();
    const dest_address = recipient.value;
    let res;
    if (selectedDestination.type === 'expatriation') {
      const isETH = selectedInput.token.asset === ethers.constants.AddressZero;
      if (!isETH) { // check allowance
        const tokenContract = new ethers.Contract(selectedInput.token.asset, erc20Abi, signer);
        const allowance = await tokenContract.allowance(sender_address, selectedDestination.src_bridge_aa);

        if (allowance.lt(bnAmount)) {
          const approval_res = await tokenContract.approve(selectedDestination.src_bridge_aa, MAX_UINT256);
          message.info("After the approval gets mined, Metamask will pop up again and request you to confirm the actual transfer", 6);
          //await wait(2000); // wait for the provider to update our nonce
          await approval_res.wait();
        }
      }
      const contract = new ethers.Contract(selectedDestination.src_bridge_aa, exportAbi, signer);
      res = await contract.transferToForeignChain(dest_address, '', bnAmount, bnReward, { value: isETH ? bnAmount : 0 });
    }
    else { // repatriation
      const contract = new ethers.Contract(selectedDestination.src_bridge_aa, importAbi, signer);
      res = await contract.transferToHomeChain(dest_address, '', bnAmount, bnReward);
    }

    sendTransferToGA(selectedInput.token, selectedDestination.token);
    const transfer = {
      src_token: selectedInput.token,
      dst_token: selectedDestination.token,
      dst_bridge_aa: selectedDestination.dst_bridge_aa,
      amount: amountIn,
      reward,
      sender_address,
      dest_address,
      txid: res.hash,
      status: 'sent',
      ts: Date.now(),
    };
    dispatch(addTransfer(transfer));
    message.success("Transfer sent and added to the list below", 5)
    // start watching dst_bridge_aa on Obyte side
    startWatchingDestinationBridge(selectedDestination.token.network, selectedDestination.dst_bridge_aa);

    // wait until mined
    await res.wait();
    dispatch(updateTransferStatus({ txid: res.hash, status: 'mined' }));
  };


  const changeDirection = () => {
    if (!selectedInput || !selectedDestination) return;

    const currentSendToken = selectedInput.token;
    const currentGetToken = selectedDestination.token;

    const willSendInput = inputs.find((i) => isEqualExceptSymbol(i.token, currentGetToken));

    if (willSendInput) {
      const willGetToken = willSendInput.destinations.find((i) => isEqualExceptSymbol(i.token, currentSendToken))
      if (willGetToken) {
        setSelectedDestination(willGetToken);
        setSelectedInput(willSendInput);
        Number(amountOut) > 0 ? setAmountIn(amountOut) : setAmountIn(undefined);
      }
    }
  }

  const inputNetwork = selectedInput?.token.network;
  const inputChainId = inputNetwork && chainIds[environment]?.[inputNetwork]

  useEffect(() => {
    if (!tokenIsInitialized && inputs && inputs.length > 0) {
      setTokenIsInitialized(true);
      setSelectedInput(inputs[0]);
      setSelectedDestination(inputs[0].destinations[0])
    } else if (tokenIsInitialized && inputs && selectedInput && selectedDestination && inputs.length > 0) {
      const newDestinationData = inputs[selectedInput.index].destinations[selectedDestination.index];
      setSelectedDestination(newDestinationData);
    }
  }, [inputs, tokenIsInitialized])

  useEffect(async () => {
    if (!window.ethereum) // no metamask installed
      return;
    window.ethereum?.on('chainChanged', (newChainId) => {
      setChainId(Number(newChainId));
    });

    const network = await provider.getNetwork();

    if (network && ("chainId" in network)) {
      setChainId(network.chainId);
    }
  }, [isOpenConnection])

  useEffect(async () => {
    if (window.ethereum && inFocus && (chainId in pendingTokens)) {
      const address = await signer.getAddress();
      pendingTokens[chainId].forEach(async params => {
        if (!(addedTokens[address]?.[chainId] && (addedTokens[address]?.[chainId]?.includes(params.options.symbol)))) {
          window.ethereum.request({
            method: 'wallet_watchAsset',
            params
          }).then(data => {
            if (data) {
              dispatch(addTokenToTracked({ address, chainId, symbol: params.options.symbol }))
            }
          });
        }
      });
      setPendingTokens((p) => ({ ...p, [chainId]: [] }));
    }
  }, [chainId, inFocus]);

  const addToken = async () => {
    if (!window.ethereum) // no metamask installed
      return;
    const address = await signer.getAddress();
    const symbol = selectedDestination.token.symbol;
    const destinationChainId = chainIds[environment][selectedDestination.token.network];

    if (selectedDestination.type !== 'expatriation') return;

    const params = {
      type: 'ERC20',
      options: {
        address: selectedDestination.dst_bridge_aa,
        symbol,
        decimals: selectedDestination.token.decimals,
        image: `${process.env.REACT_APP_ICON_CDN_URL}/${String(symbol).toUpperCase()}.svg`
      },
    };

    if (chainId === destinationChainId && !(addedTokens[address]?.[chainId] && (addedTokens[address]?.[chainId]?.includes(symbol)))) {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params
      })
      if (wasAdded) {
        dispatch(addTokenToTracked({ address, chainId, symbol }))
      }
    } else if (!pendingTokens[destinationChainId]) {
      setPendingTokens({ ...pendingTokens, [destinationChainId]: [params] })
    } else if (pendingTokens[destinationChainId] && !pendingTokens[destinationChainId].find((t) => t.options.symbol === params.options.symbol)) {
      setPendingTokens({ ...pendingTokens, [destinationChainId]: [...pendingTokens[destinationChainId], params] })
    };
  }

  return (
    <>
      <div className={`${styles.header} main_page`}>
        <div className={`${styles.container} `}>
          <Helmet title="Counterstake Bridge" />
          <Title level={1} style={{ fontWeight: "bold", fontSize: width < 768 ? (width < 500 ? 46 : 72) : 100, lineHeight: "79px", textAlign: "center", marginBottom: 0, letterSpacing: "-0.05em", marginTop: width < 768 ? 10 : 20 }}>Counterstake</Title>
          <Title level={2} style={{ textAlign: "center", marginTop: 20 }}>A cross-chain bridge</Title>

          <Paragraph style={{ fontSize: 20, textAlign: "center", fontStyle: "italic", fontWeight: 200 }}>This is new, untested, unaudited software, use with care.</Paragraph>
          <div style={{ position: "relative" }}>
            <Row style={{ marginTop: 70, opacity: inputs.length !== 0 ? 1 : 0.35 }}>
              <Col xs={{ span: 24, offset: 0 }} md={{ span: 11 }}>

                <div style={{ marginBottom: 5 }}>
                  <Text type="secondary">
                    You <b>send</b>
                  </Text>
                </div>

                <Form.Item>
                  <Input.Group compact={width > 560}>
                    <Input
                      style={{ width: !width || width > 560 ? "35%" : "100%", fontSize: 18, lineHeight: '25px', marginBottom: width > 560 ? 0 : 15 }}
                      size="large"
                      autoFocus={true}
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
                      style={{ width: !width || width > 560 ? "65%" : "100%", fontSize: 18 }}
                      size="large"
                      loading={inputs.length === 0}
                      showSearch
                      placeholder="Input currency and network"
                      optionFilterProp="label"
                      ref={searchInputInRef}
                      onChange={index => {
                        setSelectedInput(inputs[index]);
                        setSelectedDestination(inputs[index].destinations[0])
                        searchInputInRef?.current?.blur();
                      }}
                      value={selectedInput && selectedInput.index}
                    >
                      {inputs && inputs.map((input) => (
                        <Select.Option key={input.index} value={input.index} label={`${input.token.symbol} on ${input.token.network}`}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            {getCoinIcon(input.token.network, input.token.symbol)}  <span>{input.token.symbol} on {input.token.network}</span>
                          </div>
                        </Select.Option>
                      ))}{" "}
                    </Select>
                  </Input.Group>
                  {(Number(amountIn) > 0 && Number(amountOut) < 0) ? <Text type="danger" style={{ fontSize: 12 }}>Too small value to transfer.</Text> : (selectedDestination && (Number(amountIn) > Number(selectedDestination.max_amount || 0)) && <Text type="warning" style={{ fontSize: 12 }}>The maximum amount assistants can help with is {max_amount} {selectedDestination.token.symbol}.</Text>)}
                </Form.Item>
              </Col>

              <Col xs={{ span: 24, offset: 0 }} md={{ span: 2, offset: 0 }}>
                <div
                  style={{
                    marginTop: width < 768 ? -20 : 37,
                    textAlign: "center",
                    height: 38,
                    boxSizing: "border-box",
                    fontSize: "1.5em",
                  }}
                >
                  <SwapOutlined
                    rotate={width < 768 ? 90 : undefined}
                    onClick={changeDirection}
                    style={{
                      fontSize: 28, padding: 5, display: "block", height: 40, cursor: "pointer",
                      overflow: "hidden"
                    }}
                  />
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
                    style={{ width: !width || width > 560 ? "35%" : "100%", marginBottom: width > 560 ? 0 : 15, fontSize: 18, lineHeight: '25px' }}
                    size="large"
                    placeholder="Amount to receive"
                    value={(isNaN(amountOut) || amountOut < 0) ? undefined : amountOut}
                    disabled={true}
                    onKeyPress={(ev) => {
                      if (ev.key === "Enter") {
                        transferRef.current.click();
                      }
                    }}
                  />
                  <Select
                    style={{ width: !width || width > 560 ? "65%" : "100%", fontSize: 18 }}
                    size="large"
                    loading={inputs.length === 0}
                    placeholder="Token to receive"
                    ref={searchInputOutRef}
                    onChange={index => {
                      setSelectedDestination(selectedInput.destinations[index])
                      searchInputOutRef?.current?.blur();
                    }}
                    value={selectedDestination?.index}
                    optionFilterProp="label"
                    showSearch
                  >
                    {selectedInput && selectedInput.destinations.map((destination) => (
                      <Select.Option key={destination.index} value={destination.index} label={`${destination.token.symbol} on ${destination.token.network}`}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {getCoinIcon(destination.token.network, destination.token.symbol)} {destination.token.symbol} on {destination.token.network}{" "}
                        </div>
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
                        }>
                        Install Obyte wallet
                      </a> {" "}
                      if you don't have one yet, and copy/paste your address here.
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
                    size="middle"
                    style={{ height: 45, paddingRight: 30 }}
                    spellCheck="false"
                    value={recipient.value}
                    placeholder={`Your ${selectedDestination ? selectedDestination.token.network : 'receiving'} wallet address`}
                    prefix={selectedDestination && selectedDestination.token.network !== 'Obyte' &&
                      <MetamaskLogo
                        style={{ cursor: "pointer", marginRight: 5 }}
                        onClick={async () => {
                          if (!window.ethereum)
                            return message.error("Metamask not found")
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
                onClick={addToken}
                href={generateLink({
                  amount: amountIn * 10 ** selectedInput.token.decimals,
                  aa: selectedDestination.src_bridge_aa,
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
                onClick={() => { addToken(); inputChainId === chainId ? handleClickTransfer().catch((reason) => { (reason.code === "INSUFFICIENT_FUNDS" || reason.code === -32603) ? message.error("An error occurred, please check your balance") : console.error(`An error occurred, please write and we will help. (${reason?.code || "NO_CODE"}). ${reason.reason}`); }) : message.error(`Wrong network selected, please select ${selectedInput.token.network} in MetaMask`); }}
              >
                Transfer
              </Button>}
            </Row>
            {(inputs.length === 0 || !loaded) && <div style={{ position: "absolute", top: 0, right: 0, left: 0, bottom: 0, margin: "auto", opacity: 1, zIndex: 999 }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <img className={styles.loader} alt="Loading..." src="/logo.svg" width={250} style={{ padding: 40, boxSizing: "border-box" }} />
              </div>
              <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16 }}><span>Loading pairs...</span></div>
            </div>}
          </div>

          {error &&
            <Row justify="center" style={{ marginTop: 10 }}>
              <Text type="secondary" style={{ fontSize: 12, color: "red" }}>{error}</Text>
            </Row>
          }

        </div>
      </div>
      <div className={`${styles.container} ${styles.container_big}`}>
        <TransferList />
      </div>

      <div className={`${styles.container}`}>
        <Paragraph style={{ fontSize: 13, marginTop: 20, paddingTop: 10, fontWeight: 200 }}>Counterstake is a fully decentralized cross-chain transfer protocol. There are no admins, no central operators, no owners, no custodians. Participation in the protocol is open, there are no designated multisig participants, federated signers, or threshold signatures. All transfers are direct, there are no central hubs or relays. No token is required to use the protocol. There are no protocol fees. The code is immutable, not upgradable, unstoppable. There are no access controls, no gatekeepers, no KYC, no your customer.</Paragraph>
      </div>
    </>
  );
};

const isEqualExceptSymbol = (token1, token2) => token1.network === token2.network && token1.asset === token2.asset;