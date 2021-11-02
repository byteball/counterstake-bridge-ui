import { Input, Form, Button, Modal, Result, Alert, message, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { ethers, BigNumber } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import QRButton from "obyte-qr-button";

import { selectChainId } from "store/chainIdSlice";
import { selectDestAddress } from "store/destAddressSlice";
import { chainIds } from "chainIds";
import { changeNetwork } from "utils/changeNetwork";
import { generateLink } from "utils";
import { ERC20Abi, exportAssistantAbi, importAssistantAbi } from "abi";
import { ChangeAddressModal } from "modals/ChangeAddressModal";
import { updateEvmAssistant } from "store/thunks/updateEvmAssistant";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

const environment = process.env.REACT_APP_ENVIRONMENT;

const MAX_UINT256 = ethers.BigNumber.from(2).pow(256).sub(1);

export const RedeemAssistantSharesModal = ({ size, assistant_aa, swap_fee, block, side, network, exponent = 1, ts, management_fee, success_fee, shares_asset, shares_supply = 0, shares_symbol, shares_decimals = 0, stake_profit = 0, stake_mf = 0, stake_asset, stake_asset_symbol, stake_asset_decimals = 0, stake_balance = 0, stake_balance_in_work = 0, stake_sf = 0, image_asset, image_asset_symbol, image_asset_decimals = 0, image_balance = 0, image_balance_in_work = 0, image_mf = 0, image_sf = 0, image_profit = 0 }) => {
  const [stakeAmount, setStakeAmount] = useState();
  const [imageAmount, setImageAmount] = useState();
  const [sharesAmount, setSharesAmount] = useState();
  const [error, setError] = useState();
  const [isVisible, setIsVisible] = useState(false);
  const timestamp = Number(Date.now() / 1000).toFixed(0);

  const chainId = useSelector(selectChainId);
  const addresses = useSelector(selectDestAddress);

  const dispatch = useDispatch();

  useEffect(() => {
    setStakeAmount(undefined);
    setImageAmount(undefined);
    setSharesAmount(undefined)
    setError();
  }, [isVisible]);

  const sharesHandleChange = (ev) => {
    const reg = /^[0-9.]+$/;
    if (reg.test(String(ev.target.value))) {
      if (f(ev.target.value) <= shares_decimals && Number(ev.target.value) <= 1e20) {
        if (!isNaN(ev.target.value)) {
          setSharesAmount(ev.target.value);
        }
      }
    } else if (ev.target.value === "") {
      setSharesAmount(undefined)
    }
  }

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

  useEffect(() => {
    if (isVisible && Number(sharesAmount)) {
      const share_of_shares = (sharesAmount * 10 ** Number(shares_decimals)) / Number(shares_supply);
      const remaining_share_of_shares = 1 - share_of_shares;
      const remaining_share_of_assets = remaining_share_of_shares ** Number(exponent);
      const share_of_assets = 1 - remaining_share_of_assets;

      if (sharesAmount * 10 ** shares_decimals < shares_supply) {
        if (side === "export") {
          const gross_balance = Number(stake_balance) + Number(stake_balance_in_work);
          const scaled_mf = (timestamp - Number(ts)) / (360 * 24 * 3600) * Number(management_fee);
          const delta_mf = gross_balance * scaled_mf;
          const mf = Number(stake_mf) + delta_mf;
          const sf = Math.max(Math.floor(Number(stake_profit) * Number(success_fee)), 0);
          const balance = gross_balance - mf - sf;
          const risk_free_balance = Number(balance) - Number(stake_balance_in_work);
          const stake_amount = Math.floor(share_of_assets * risk_free_balance);

          setStakeAmount(+Number(stake_amount / 10 ** stake_asset_decimals).toFixed(stake_asset_decimals));
        } else {
          const gross_stake_balance = (Number(stake_balance) - (stake_asset === "base" ? 1e4 : 0)) + Number(stake_balance_in_work);
          const gross_image_balance = Number(image_balance) + Number(image_balance_in_work);

          const sBalance = gross_stake_balance - Number(stake_mf) - Number(stake_sf);
          const iBalance = gross_image_balance - Number(image_mf) - Number(image_sf);

          const risk_free_stake_balance = sBalance - Number(stake_balance_in_work);
          const risk_free_image_balance = iBalance - Number(image_balance_in_work);

          const stake_amount = Math.floor(share_of_assets * risk_free_stake_balance * (1 - Number(swap_fee)));
          const image_amount = Math.floor(share_of_assets * risk_free_image_balance * (1 - Number(swap_fee)));

          setStakeAmount(+Number(stake_amount / 10 ** stake_asset_decimals).toFixed(stake_asset_decimals));
          setImageAmount(+Number(image_amount / 10 ** image_asset_decimals).toFixed(image_asset_decimals));
        }

        setError();
      } else {
        setError("The quantity will exceed the issued")
      }
    }
  }, [sharesAmount, stake_mf, stake_sf, image_mf, image_sf, stake_balance, image_balance, stake_profit, image_profit]);

  const link = network === "Obyte" ? generateLink({ amount: Number(sharesAmount * 10 ** shares_decimals).toFixed(shares_decimals), aa: assistant_aa, asset: shares_asset }) : undefined;

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


  const redeemSharesFromEVM = async () => {
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
      provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      signer = window.ethereum && provider.getSigner();

      const recipientAddress = addresses[network];
      const metaMaskAddress = await signer.getAddress();
      if (recipientAddress !== metaMaskAddress) return message.error(`The wallet address in metamask is different from the recipient. Please select the ${recipientAddress.slice(0, 10)}... account.`)

      const bnSharesAmount = (sharesAmount && Number(sharesAmount)) ? ethers.utils.parseUnits(Number(sharesAmount).toFixed(shares_decimals), shares_decimals) : 0;

      // approve
      await approve(bnSharesAmount, stake_asset);

      // send: create contact
      signer = window.ethereum && provider.getSigner();
      const assistantContract = new ethers.Contract(assistant_aa, side === "export" ? exportAssistantAbi : importAssistantAbi, signer);

      // send: call redeemShares

      const res = await assistantContract.redeemShares(bnSharesAmount);
      await res?.wait();
      dispatch(updateEvmAssistant(assistant_aa));
    } catch (e) {
      console.log(e);
      dispatch(updateEvmAssistant(assistant_aa));
    }
  }

  const isValidAction = error === undefined && Number(sharesAmount) > 0;

  return <div onClick={stopPropagation}>
    {addresses[network]
      ? <Button onClick={openModal} block={block} size={size} disabled={(network !== "Obyte" && !window.ethereum) || !addresses[network]}>Redeem shares</Button>
      : <Tooltip title={<ChangeAddressModal network={network}>Please add your {String(network).toLowerCase()} wallet address</ChangeAddressModal>}>
        <Button onClick={openModal} block={block} size={size} disabled={(network !== "Obyte" && !window.ethereum) || !addresses[network]}>Redeem shares</Button>
      </Tooltip>}
    <Modal title="Redeem shares" visible={isVisible} onCancel={closeModal} footer={null} onClick={stopPropagation}>
      {(!BigNumber.from(String(shares_supply)).isZero()) ? <Form layout="vertical">
        <div><b>You send:</b></div>
        <Form.Item>
          <Input placeholder="Amount in shares tokens" value={sharesAmount} onChange={sharesHandleChange} suffix={shares_symbol} />
        </Form.Item>

        <div><b>You get:</b></div>
        <Form.Item>
          <Input placeholder="Amount in stake tokens" disabled={true} value={isValidAction ? stakeAmount : undefined} suffix={stake_asset_symbol} />
        </Form.Item>

        {side === "import" && <Form.Item>
          <Input placeholder="Amount in imported tokens" disabled={true} value={isValidAction ? imageAmount : undefined} suffix={image_asset_symbol} />
        </Form.Item>}

        {error ? <Form.Item><Alert type="error" message={error} /></Form.Item> : null}

        {network === "Obyte" ? <QRButton type="primary" href={link} onClick={redeemSharesFromEVM} disabled={!isValidAction}>Send{isValidAction ? <>&nbsp;{sharesAmount} {shares_symbol || shares_asset.slice(0, 6) + "..."}</> : ""}</QRButton> : <Button type="primary" onClick={redeemSharesFromEVM} disabled={!isValidAction}>Send{isValidAction ? <>&nbsp;{sharesAmount} {shares_symbol || shares_asset.slice(0, 6) + "..."}</> : ""}</Button>}

      </Form> : <Result
        status="error"
        title="No shares issued yet"
      />}
    </Modal>
  </div>
}