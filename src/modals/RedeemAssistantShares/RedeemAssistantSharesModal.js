import { Input, Form, Button, Modal, Result, Alert, message, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { ethers, BigNumber, FixedNumber } from "ethers";
import { useDispatch, useSelector } from "react-redux";

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
const fn1e4 = FixedNumber.from(1e4);

export const RedeemAssistantSharesModal = ({ size, assistant_aa, swap_fee, block, side, network, exponent = 1, ts, management_fee, success_fee, shares_asset, shares_supply = 0, shares_symbol, shares_decimals, stake_profit = 0, stake_mf = 0, stake_asset, stake_asset_symbol, stake_asset_decimals, stake_balance = 0, stake_balance_in_work = 0, stake_sf, image_asset, image_asset_symbol, image_asset_decimals, image_balance = 0, image_balance_in_work = 0, image_mf = 0, image_sf = 0, image_profit }) => {
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
      if (network === "Obyte") {
        const share_of_shares = (sharesAmount * 10 ** shares_decimals) / shares_supply;
        const remaining_share_of_shares = 1 - share_of_shares;
        const remaining_share_of_assets = remaining_share_of_shares ** exponent;
        const share_of_assets = 1 - remaining_share_of_assets;

        if (sharesAmount * 10 ** shares_decimals < shares_supply) {
          if (side === "export") {
            const gross_balance = stake_balance + stake_balance_in_work; // - received_stake_amount;
            const scaled_mf = (timestamp - ts) / (360 * 24 * 3600) * management_fee;
            const delta_mf = gross_balance * scaled_mf;
            const mf = stake_mf + delta_mf;
            const sf = Math.max(Math.floor(stake_profit * success_fee), 0);
            const balance = gross_balance - mf - sf;
            const risk_free_balance = balance - stake_balance_in_work;
            const stake_amount = Math.floor(share_of_assets * risk_free_balance);

            setStakeAmount(+Number(stake_amount / 10 ** stake_asset_decimals).toFixed(stake_asset_decimals));
          } else {
            const gross_stake_balance = (stake_balance - (stake_asset === "base" ? 1e4 : 0)) + stake_balance_in_work;
            const gross_image_balance = image_balance + image_balance_in_work;

            const sBalance = gross_stake_balance - stake_mf - stake_sf;
            const iBalance = gross_image_balance - image_mf - image_sf;

            const risk_free_stake_balance = sBalance - stake_balance_in_work;
            const risk_free_image_balance = iBalance - image_balance_in_work;

            const stake_amount = Math.floor(share_of_assets * risk_free_stake_balance * (1 - swap_fee));
            const image_amount = Math.floor(share_of_assets * risk_free_image_balance * (1 - swap_fee));

            setStakeAmount(+Number(stake_amount / 10 ** stake_asset_decimals).toFixed(stake_asset_decimals));
            setImageAmount(+Number(image_amount / 10 ** image_asset_decimals).toFixed(image_asset_decimals));
          }

          setError();
        } else {
          setError("The quantity will exceed the issued")
        }
      } else { // EVM NETWORK
        const bnSharesAmount = (sharesAmount && Number(sharesAmount)) ? ethers.utils.parseUnits(Number(sharesAmount).toFixed(shares_decimals), shares_decimals) : BigNumber.from("0");

        if (!(sharesAmount && Number(sharesAmount)) || bnSharesAmount.lt(BigNumber.from(shares_supply))) {

          if (side === "export") {
            const bnGrossBalance = FixedNumber.from(stake_balance).addUnsafe(FixedNumber.from(stake_balance_in_work));

            const bnNewMf = FixedNumber.from(stake_mf).mulUnsafe(FixedNumber.from(management_fee * 1e4).divUnsafe(fn1e4)).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)); //TODO: Исправить, добавить bnGrossBalance

            const fnNetBalance = bnGrossBalance.subUnsafe(bnNewMf).subUnsafe(FixedNumber.from(stake_profit).mulUnsafe(FixedNumber.from(success_fee * 1e4)).divUnsafe(fn1e4));

            const intNetBalance = fnNetBalance.ceiling().toString().split(".")[0];

            if (!fnNetBalance.isNegative()) {
              if (BigNumber.from(intNetBalance).gt(stake_balance_in_work)) {

                const bnAmount = fnNetBalance.subUnsafe(FixedNumber.from(stake_balance_in_work)).mulUnsafe(FixedNumber.from(BigNumber.from(shares_supply).pow(exponent).toString()).subUnsafe(FixedNumber.from(BigNumber.from(shares_supply).sub(bnSharesAmount.toString()).pow(String(exponent)).toString()))).divUnsafe(FixedNumber.from(BigNumber.from(shares_supply).pow(exponent).toString()))
                const intAmount = bnAmount.ceiling().toString().split(".")[0];

                const bigSharesAmount = ethers.utils.formatUnits(BigNumber.from(intAmount), stake_asset_decimals);
                setStakeAmount(bigSharesAmount);
              } else {
                setError("Negative risk-free net balance")
              }

              setError();
            } else {
              setError("Negative net balance")
            }
          } else { // import
            
            const bnStakeGrossBalance = FixedNumber.from(stake_balance).addUnsafe(FixedNumber.from(stake_balance_in_work));
            const bnImageGrossBalance = FixedNumber.from(image_balance).addUnsafe(FixedNumber.from(image_balance_in_work));

            const bnStakeNewMf = FixedNumber.from(stake_mf).addUnsafe(bnStakeGrossBalance.mulUnsafe(FixedNumber.from(management_fee * 1e4)).divUnsafe(fn1e4).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)));
            const bnImageNewMf = FixedNumber.from(image_mf).addUnsafe(bnImageGrossBalance.mulUnsafe(FixedNumber.from(management_fee * 1e4)).divUnsafe(fn1e4).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)));

            const bnStakeNetBalance = bnStakeGrossBalance.subUnsafe(bnStakeNewMf).subUnsafe(FixedNumber.from(stake_profit).isNegative ? FixedNumber.from("0") : FixedNumber.from(success_fee * 1e4).divUnsafe(fn1e4).mulUnsafe(FixedNumber(stake_profit)));
            const bnImageNetBalance = bnImageGrossBalance.subUnsafe(bnImageNewMf).subUnsafe(FixedNumber.from(image_profit).isNegative ? FixedNumber.from("0") : FixedNumber.from(success_fee * 1e4).divUnsafe(fn1e4).mulUnsafe(FixedNumber(image_profit)));

            if (!bnStakeNetBalance.isNegative()) {
              if (!bnImageNetBalance.isNegative()) {
                if (BigNumber.from(bnStakeNetBalance).gt(stake_balance_in_work)) {
                  if (BigNumber.from(bnImageNetBalance).gt(image_balance_in_work)) {

                    let bnStakeAssetAmount = bnStakeNetBalance.subUnsafe(FixedNumber.from(stake_balance_in_work)).mulUnsafe(FixedNumber.from(BigNumber.from(shares_supply).pow(exponent).toString()).subUnsafe(FixedNumber.from(BigNumber.from(shares_supply).sub(bnSharesAmount.toString()).pow(String(exponent)).toString()))).divUnsafe(FixedNumber.from(BigNumber.from(shares_supply).pow(exponent).toString()))
                    bnStakeAssetAmount = bnStakeAssetAmount.subUnsafe(bnStakeAssetAmount.mulUnsafe(FixedNumber.from(String(swap_fee)))).ceiling().toString().split(".")[0];

                    let bnImageAssetAmount = bnImageNetBalance.subUnsafe(FixedNumber.from(image_balance_in_work)).mulUnsafe(FixedNumber.from(BigNumber.from(shares_supply).pow(exponent).toString()).subUnsafe(FixedNumber.from(BigNumber.from(shares_supply).sub(bnSharesAmount.toString()).pow(String(exponent)).toString()))).divUnsafe(FixedNumber.from(BigNumber.from(shares_supply).pow(exponent).toString()))
                    bnImageAssetAmount = bnImageAssetAmount.subUnsafe(bnImageAssetAmount.mulUnsafe(FixedNumber.from(String(swap_fee)))).ceiling().toString().split(".")[0];

                    const bnStakeAmountInBig = ethers.utils.formatUnits(BigNumber.from(bnStakeAssetAmount), stake_asset_decimals).toString();
                    const bnImageAmountInBig = ethers.utils.formatUnits(BigNumber.from(bnImageAssetAmount), image_asset_decimals).toString();

                    setStakeAmount(bnStakeAmountInBig);
                    setImageAmount(bnImageAmountInBig);
                    setError();
                  } else {
                    setError("Negative risk-free net balance in imported asset")
                  }
                } else {
                  setError("Negative risk-free net balance in stake asset")
                }
              } else {
                setError("Negative net balance in imported asset")
              }
            } else {
              setError("Negative net balance in stake asset")
            }
          }

        } else {
          setError("The quantity will exceed the issued")
        }
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
      const assistantContact = new ethers.Contract(assistant_aa, side === "export" ? exportAssistantAbi : importAssistantAbi, signer);

      // send: call redeemShares

      const res = await assistantContact.redeemShares(bnSharesAmount);
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

        <Button type="primary" href={link} onClick={redeemSharesFromEVM} disabled={!isValidAction}>Send {isValidAction ? <> {sharesAmount} {shares_symbol || shares_asset.slice(0, 6) + "..."}</> : ""}</Button>

      </Form> : <Result
        status="error"
        title="No shares issued yet"
      />}
    </Modal>
  </div>
}