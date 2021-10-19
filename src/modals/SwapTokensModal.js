import { SwapOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, message, Modal, Tooltip } from "antd";
import QRButton from "obyte-qr-button";
import { chainIds } from "chainIds";
import { ethers, BigNumber, FixedNumber } from "ethers";
import { isEmpty } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ERC20Abi, importAssistantAbi } from "abi";
import { selectChainId } from "store/chainIdSlice";
import { selectDestAddress } from "store/destAddressSlice";
import { generateLink } from "utils";
import { changeNetwork } from "utils/changeNetwork";
import { ChangeAddressModal } from "./ChangeAddressModal";
import { updateEvmAssistant } from "store/thunks/updateEvmAssistant";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);
const MAX_UINT256 = BigNumber.from(2).pow(256).sub(1);
const fn1e4 = FixedNumber.from(1e4);

const environment = process.env.REACT_APP_ENVIRONMENT;

export const SwapTokensModal = ({ block, size, assistant_aa, network, swap_fee, ts, management_fee, success_fee, image_share, image_asset, image_asset_decimals, image_asset_symbol, image_balance = 0, image_balance_in_work = 0, image_mf = 0, image_sf = 0, image_profit = 0, stake_share, stake_asset, stake_asset_decimals, stake_asset_symbol, stake_balance = 0, stake_balance_in_work = 0, stake_sf = 0, stake_mf = 0, stake_profit = 0 }) => {
  const [sendAmount, setSendAmount] = useState();
  const [getAmount, setGetAmount] = useState();
  const [isVisible, setIsVisible] = useState(false);
  const [typeGetToken, setTypeGetToken] = useState("image"); //"stake" or "image"
  const [error, setError] = useState();
  const [imageToken, setImageToken] = useState({});
  const [stakeToken, setStakeToken] = useState({});

  const timestamp = Math.trunc(Date.now() / 1000);

  const chainId = useSelector(selectChainId);
  const addresses = useSelector(selectDestAddress);

  const sendInputRef = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    setImageToken({ type: "image", asset: image_asset, decimals: image_asset_decimals, symbol: image_asset_symbol, balance: image_balance, balance_in_work: image_balance_in_work, share: image_share, mf: image_mf, sf: image_sf, profit: image_profit });
    setStakeToken({ type: "stake", asset: stake_asset, decimals: stake_asset_decimals, symbol: stake_asset_symbol, balance: stake_balance, balance_in_work: stake_balance_in_work, share: stake_share, mf: stake_mf, sf: stake_sf, profit: stake_profit });
  }, [image_balance, stake_balance, image_balance_in_work, stake_balance_in_work, image_share, stake_share, image_mf, stake_mf, image_sf, stake_sf, image_profit, stake_profit])

  const sendToken = typeGetToken === "image" ? stakeToken : imageToken;
  const getToken = typeGetToken === "image" ? imageToken : stakeToken;

  const openModal = (e) => {
    stopPropagation(e);
    setIsVisible(true);
  }

  const closeModal = (e) => {
    stopPropagation(e);
    setIsVisible(false);
  }

  const stopPropagation = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
  }

  const isValidAction = sendAmount && Number(sendAmount) && getAmount && error === undefined;

  const handleChange = (ev) => {
    const reg = /^[0-9.]+$/;
    if (reg.test(String(ev.target.value))) {
      if (f(ev.target.value) <= sendToken.decimals && Number(ev.target.value) <= 1e20) {
        if (!isNaN(ev.target.value)) {
          setSendAmount(ev.target.value);
        }
      }
    } else if (ev.target.value === "") {
      setSendAmount(undefined)
    }
  }

  useEffect(() => {
    if (!isEmpty(sendToken) && !isEmpty(getToken) && sendAmount && Number(sendAmount)) {
      if (network === "Obyte") {
        const net_of_swap_fee = 1 - swap_fee;
        const risk_free_balance = getToken.balance - getToken.balance_in_work;

        const gross_balance = sendToken.balance + sendToken.balance_in_work;
        const scaled_mf = (Math.trunc(Date.now() / 1000) - ts) / (360 * 24 * 3600) * management_fee;
        const delta_mf = gross_balance * scaled_mf;
        const mf = sendToken.mf + delta_mf;
        const sf = Math.max(Math.floor(sendToken.profit * success_fee), 0);
        const net_balance = gross_balance - mf - sf;

        const amount = Math.floor(risk_free_balance * (1 - (net_balance / (net_balance + (sendAmount || 0) * 10 ** sendToken.decimals)) ** (sendToken.share / getToken.share)) * net_of_swap_fee);

        setGetAmount(+Number(amount / 10 ** getToken.decimals).toFixed(getToken.decimals));
      } else { // EVM network

        const bnSendGrossBalance = FixedNumber.from(sendToken.balance).addUnsafe(FixedNumber.from(sendToken.balance_in_work));
        const bnGetGrossBalance = FixedNumber.from(getToken.balance).addUnsafe(FixedNumber.from(getToken.balance_in_work));

        const bnSendNewMf = FixedNumber.from(sendToken.mf).addUnsafe(bnSendGrossBalance.mulUnsafe(FixedNumber.from(management_fee * 1e4)).divUnsafe(fn1e4).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)));
        const bnGetNewMf = FixedNumber.from(getToken.mf).addUnsafe(bnGetGrossBalance.mulUnsafe(FixedNumber.from(management_fee * 1e4)).divUnsafe(fn1e4).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)));

        const bnSendNetBalance = bnSendGrossBalance.subUnsafe(bnSendNewMf).subUnsafe(FixedNumber.from(sendToken.profit).isNegative ? FixedNumber.from("0") : FixedNumber.from(success_fee * 1e4).divUnsafe(fn1e4).mulUnsafe(FixedNumber(sendToken.profit)));
        const bnGetNetBalance = bnGetGrossBalance.subUnsafe(bnGetNewMf).subUnsafe(FixedNumber.from(getToken.profit).isNegative ? FixedNumber.from("0") : FixedNumber.from(success_fee * 1e4).divUnsafe(fn1e4).mulUnsafe(FixedNumber(getToken.profit)));


        if (!bnSendNetBalance.isNegative()) {
          if (!bnGetNetBalance.isNegative()) {
            const bnSendAmount = sendAmount && Number(sendAmount) > 0 ? ethers.utils.parseUnits(Number(sendAmount).toFixed(sendToken.decimals), sendToken.decimals) : BigNumber.from("0");

            let bnGetTokenAmount = bnGetNetBalance.subUnsafe(FixedNumber.from(getToken.balance_in_work)).mulUnsafe(FixedNumber.from(bnSendAmount)).divUnsafe(bnSendNetBalance.addUnsafe(FixedNumber.from(bnSendAmount)));

            bnGetTokenAmount = bnGetTokenAmount.subUnsafe(bnGetTokenAmount.mulUnsafe(FixedNumber.from(swap_fee * 1e4).divUnsafe(fn1e4))).ceiling().toString().split(".")[0];

            setGetAmount(ethers.utils.formatUnits(bnGetTokenAmount.toString(), getToken.decimals, getToken.decimals))

            setError();
          } else {
            setError(`Negative net balance in ${getToken.type} asset`);
          }
        } else {
          setError(`Negative net balance in ${sendToken.type} asset`);
        }
      }
    }
  }, [network, sendAmount, sendToken, getToken, isVisible]);

  useEffect(() => {
    if (sendInputRef?.current && isVisible) {
      sendInputRef.current.focus();
    }

  }, [sendInputRef.current, isVisible])

  const link = network === "Obyte" ? generateLink({ amount: Number(sendAmount * 10 ** sendToken.decimals).toFixed(sendToken.decimals), aa: assistant_aa, asset: sendToken.asset }) : undefined;

  const loginEthereum = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  };

  const approve = async (bnAmount, tokenAddress) => {
    if (tokenAddress !== ethers.constants.AddressZero && bnAmount !== undefined) {
      const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      const signer = window.ethereum && provider.getSigner();

      const sender_address = await signer.getAddress();

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20Abi,
        signer
      );

      const allowance = await tokenContract.allowance(sender_address, assistant_aa);

      if (allowance.lt(bnAmount)) {
        const approval_res = await tokenContract.approve(
          assistant_aa,
          MAX_UINT256
        );

        await approval_res.wait();
      }
    }
  }


  const swap = async () => {
    if (!window.ethereum || network === "Obyte") return;

    try {
      // login
      await loginEthereum();

      let provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      let signer = window.ethereum && provider.getSigner();

      // check chain
      const assistantChainId = chainIds[environment]?.[network]
      if (!chainId || chainId !== assistantChainId) {
        await changeNetwork(network)
      }

      // check address
      const recipientAddress = addresses[network];
      const metaMaskAddress = await signer.getAddress();
      if (recipientAddress !== metaMaskAddress) return message.error(`The wallet address in metamask is different from the recipient. Please select the ${recipientAddress.slice(0, 10)}... account.`)

      const bnSendAmount = (sendAmount && Number(sendAmount)) ? ethers.utils.parseUnits(Number(sendAmount).toFixed(sendToken.decimals), sendToken.decimals) : 0;

      // approve
      await approve(bnSendAmount, sendToken.asset);

      // send: create contact
      provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      signer = window.ethereum && provider.getSigner();

      const assistantContact = new ethers.Contract(assistant_aa, importAssistantAbi, signer);

      // send: call swapImage2Stake/swapStake2Image
      let res;
      if (typeGetToken === "stake") {
        res = await assistantContact.swapImage2Stake(bnSendAmount);
      } else {
        if (sendToken.asset === ethers.constants.AddressZero) {
          res = await assistantContact.swapStake2Image(bnSendAmount, { value: bnSendAmount });
        } else {
          res = await assistantContact.swapStake2Image(bnSendAmount);
        }
      }
      await res?.wait();
      dispatch(updateEvmAssistant(assistant_aa));
    } catch (e) {
      console.log(e);
      dispatch(updateEvmAssistant(assistant_aa));
    }
  }


  const changeDirection = () => {
    if (Number(getAmount) > 0) {
      setSendAmount(+Number(getAmount).toFixed(getToken.decimals));
    }
    setTypeGetToken((t) => t === "image" ? "stake" : "image");
  }

  return <div onClick={stopPropagation}>
    {addresses[network]
      ? <Button onClick={openModal} block={block} size={size} disabled={(network !== "Obyte" && !window.ethereum) || !addresses[network] || BigNumber.from(String(stake_balance)).isZero() || BigNumber.from(String(image_balance)).isZero()}>Swap tokens</Button>
      : <Tooltip title={<ChangeAddressModal network={network}>Please add your {String(network).toLowerCase()} wallet address</ChangeAddressModal>}>
        <Button onClick={openModal} block={block} size={size} disabled={(network !== "Obyte" && !window.ethereum) || !addresses[network]}>Swap tokens</Button>
      </Tooltip>}
    <Modal title="Swap tokens" visible={isVisible} onCancel={closeModal} footer={null} onClick={stopPropagation}>
      <Form>
        <div><b>You send:</b></div>
        <Form.Item>
          <Input autoFocus={true} ref={sendInputRef} placeholder={`Amount ${sendToken.type} tokens`} value={sendAmount} onChange={handleChange} suffix={sendToken.symbol} />
        </Form.Item>
        <div style={{ textAlign: "center" }}>
          <SwapOutlined style={{ fontSize: 24, transform: "rotate(90deg)", cursor: "pointer" }} onClick={changeDirection} />
        </div>
        <div><b>You get:</b></div>
        <Form.Item>
          <Input placeholder={`Amount ${getToken.type} tokens`} disabled={true} value={isValidAction ? getAmount : undefined} suffix={getToken.symbol} />
        </Form.Item>
        {error ? <Form.Item><Alert type="error" message={error} /></Form.Item> : null}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {network === "Obyte" ? <QRButton type="primary" href={link} onClick={swap} disabled={!isValidAction || Number(getAmount) <= 0}>Send{isValidAction ? <> {sendAmount} {sendToken.symbol}</> : ""}</QRButton>
            : <Button type="primary" href={link} onClick={swap} disabled={!isValidAction || Number(getAmount) <= 0}>Send{isValidAction ? <> {sendAmount} {sendToken.symbol}</> : ""}</Button>}
        </div>
      </Form>
    </Modal>
  </div>
}