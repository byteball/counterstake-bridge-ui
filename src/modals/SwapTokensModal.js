import { SwapOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, message, Modal, Tooltip } from "antd";
import QRButton from "obyte-qr-button";
import { chainIds } from "chainIds";
import { ethers, BigNumber } from "ethers";
import { isEmpty } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";

import { ERC20Abi, importAssistantAbi } from "abi";
import { selectChainId } from "store/chainIdSlice";
import { selectDestAddress } from "store/destAddressSlice";
import { generateLink } from "utils";
import { changeNetwork } from "utils/changeNetwork";
import { ChangeAddressModal } from "./ChangeAddressModal";
import { updateEvmAssistant } from "store/thunks/updateEvmAssistant";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);
const MAX_UINT256 = BigNumber.from(2).pow(256).sub(1);

const environment = process.env.REACT_APP_ENVIRONMENT;

export const SwapTokensModal = ({ block, size, assistant_aa, network, swap_fee, ts, management_fee, success_fee, image_share, image_asset, image_asset_decimals, image_asset_symbol, image_balance = 0, image_balance_in_work = 0, image_mf = 0, image_sf = 0, image_profit = 0, stake_share, stake_asset, stake_asset_decimals, stake_asset_symbol, stake_balance = 0, stake_balance_in_work = 0, stake_sf = 0, stake_mf = 0, stake_profit = 0 }) => {
  const [amountIn, setAmountIn] = useState();
  const [amountOut, setAmountOut] = useState();
  const [isVisible, setIsVisible] = useState(false);
  const [typeOutToken, setTypeOutToken] = useState("image"); //"stake" or "image"
  const [error, setError] = useState();
  const [imageToken, setImageToken] = useState({});
  const [stakeToken, setStakeToken] = useState({});

  const timestamp = moment.utc().unix();

  const chainId = useSelector(selectChainId);
  const addresses = useSelector(selectDestAddress);

  const sendInputRef = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    setImageToken({ type: "image", asset: image_asset, decimals: Number(image_asset_decimals), symbol: image_asset_symbol, balance: Number(image_balance), balance_in_work: Number(image_balance_in_work), share: Number(image_share), mf: Number(image_mf), sf: Number(image_sf), profit: Number(image_profit) });
    setStakeToken({ type: "stake", asset: stake_asset, decimals: Number(stake_asset_decimals), symbol: stake_asset_symbol, balance: Number(stake_balance), balance_in_work: Number(stake_balance_in_work), share: Number(stake_share), mf: Number(stake_mf), sf: Number(stake_sf), profit: Number(stake_profit) });
  }, [image_balance, stake_balance, image_balance_in_work, stake_balance_in_work, image_share, stake_share, image_mf, stake_mf, image_sf, stake_sf, image_profit, stake_profit])

  const inToken = typeOutToken === "image" ? stakeToken : imageToken;
  const outToken = typeOutToken === "image" ? imageToken : stakeToken;

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

  const isValidAction = amountIn && Number(amountIn) && amountOut && error === undefined;

  const handleChange = (ev) => {
    const reg = /^[0-9.]+$/;
    if (reg.test(String(ev.target.value))) {
      if (f(ev.target.value) <= inToken.decimals && Number(ev.target.value) <= 1e20) {
        if (!isNaN(ev.target.value)) {
          setAmountIn(ev.target.value);
        }
      }
    } else if (ev.target.value === "") {
      setAmountIn(undefined)
    }
  }

  useEffect(() => {
    if (!isEmpty(inToken) && !isEmpty(outToken) && amountIn && Number(amountIn)) {
      if (network === "Obyte") {
        const net_of_swap_fee = 1 - swap_fee;
        
        const inGrossBalance = inToken.balance + inToken.balance_in_work;
        const outGrossBalance = outToken.balance + outToken.balance_in_work;

        const scaled_mf = (timestamp - Number(ts)) / (360 * 24 * 3600) * Number(management_fee);

        const inDeltaMf = inGrossBalance * scaled_mf;
        const outDeltaMf = outGrossBalance * scaled_mf;

        const inMf = inToken.mf + inDeltaMf;
        const outMf = outToken.mf + outDeltaMf;

        const inSf = Math.max(Math.floor(inToken.profit * Number(success_fee)), 0);
        const outSf = Math.max(Math.floor(outToken.profit * Number(success_fee)), 0);

        const inNetBalance = inGrossBalance - inMf - inSf;
        const outNetBalance = outGrossBalance - outMf - outSf;

        const risk_free_balance = outNetBalance - outToken.balance_in_work;

        const amount = Math.floor(risk_free_balance * (1 - (inNetBalance / (inNetBalance + (Number(amountIn) || 0) * 10 ** inToken.decimals)) ** (inToken.share / outToken.share)) * net_of_swap_fee);
        setAmountOut(+Number(amount / 10 ** outToken.decimals).toFixed(outToken.decimals));
      } else { // EVM network

        const inGrossBalance = inToken.balance + inToken.balance_in_work;
        const outGrossBalance = outToken.balance + outToken.balance_in_work;

        const inNewMf = inToken.mf + (inGrossBalance * Number(management_fee) * (timestamp - Number(ts)) / (360 * 24 * 3600));
        const outNewMf = outToken.mf + (outGrossBalance * Number(management_fee) * (timestamp - Number(ts)) / (360 * 24 * 3600));
        
        const inNetBalance = inGrossBalance - inNewMf - Math.max(inToken.profit * success_fee, 0)
        const outNetBalance = outGrossBalance - outNewMf - Math.max(outToken.profit * success_fee, 0)

        if (inNetBalance > 0) {
          if (outNetBalance > 0) {
            let outTokenAmount = (outNetBalance - outToken.balance_in_work) * (amountIn * 10 ** inToken.decimals) / (inNetBalance + amountIn * 10 ** inToken.decimals)
            outTokenAmount -= outTokenAmount * swap_fee;

            setAmountOut(Number(outTokenAmount).toFixed(outToken.decimals) / 10 ** outToken.decimals)

            setError();
          } else {
            setError(`Negative net balance in ${outToken.type} asset`);
          }
        } else {
          setError(`Negative net balance in ${inToken.type} asset`);
        }
      }
    }
  }, [network, amountIn, inToken, outToken, isVisible]);

  useEffect(() => {
    if (sendInputRef?.current && isVisible) {
      sendInputRef.current.focus();
    }

  }, [sendInputRef.current, isVisible])

  const link = network === "Obyte" ? generateLink({ amount: Number(amountIn * 10 ** inToken.decimals).toFixed(inToken.decimals), aa: assistant_aa, asset: inToken.asset }) : undefined;

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

      const bnSendAmount = (amountIn && Number(amountIn)) ? ethers.utils.parseUnits(Number(amountIn).toFixed(inToken.decimals), inToken.decimals) : 0;

      // approve
      await approve(bnSendAmount, inToken.asset);

      // send: create contact
      provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      signer = window.ethereum && provider.getSigner();

      const assistantContract = new ethers.Contract(assistant_aa, importAssistantAbi, signer);

      // send: call swapImage2Stake/swapStake2Image
      let res;
      if (typeOutToken === "stake") {
        res = await assistantContract.swapImage2Stake(bnSendAmount);
      } else {
        if (inToken.asset === ethers.constants.AddressZero) {
          res = await assistantContract.swapStake2Image(bnSendAmount, { value: bnSendAmount });
        } else {
          res = await assistantContract.swapStake2Image(bnSendAmount);
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
    if (Number(amountOut) > 0) {
      setAmountIn(+Number(amountOut).toFixed(outToken.decimals));
    }
    setTypeOutToken((t) => t === "image" ? "stake" : "image");
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
          <Input autoFocus={true} ref={sendInputRef} placeholder={`Amount in ${inToken.type} tokens`} value={amountIn} onChange={handleChange} suffix={inToken.symbol} />
        </Form.Item>
        <div style={{ textAlign: "center" }}>
          <SwapOutlined style={{ fontSize: 24, transform: "rotate(90deg)", cursor: "pointer" }} onClick={changeDirection} />
        </div>
        <div><b>You get:</b></div>
        <Form.Item>
          <Input placeholder={`Amount in ${outToken.type} tokens`} disabled={true} value={isValidAction ? amountOut : undefined} suffix={outToken.symbol} />
        </Form.Item>
        {error ? <Form.Item><Alert type="error" message={error} /></Form.Item> : null}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {network === "Obyte" ? <QRButton type="primary" href={link} onClick={swap} disabled={!isValidAction || Number(amountOut) <= 0}>Send{isValidAction ? <>&nbsp;{amountIn} {inToken.symbol}</> : ""}</QRButton>
            : <Button type="primary" href={link} onClick={swap} disabled={!isValidAction || Number(amountOut) <= 0}>Send{isValidAction ? <>&nbsp;{amountIn} {inToken.symbol}</> : ""}</Button>}
        </div>
      </Form>
    </Modal>
  </div>
}