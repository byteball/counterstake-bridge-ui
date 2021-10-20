import { Button, Form, Input, Typography, Modal, message, Tooltip, Checkbox } from "antd"
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { randomBytes } from "crypto";
import { ethers, BigNumber, FixedNumber } from "ethers";
import QRButton from "obyte-qr-button";

import { generateLink } from "utils";
import { generatePaymentMessage, get_shares } from "./helpers";
import texto from "utils/texto";
import { selectInvite } from "store/assistantsSlice";
import { CreateForward } from "./components/CreateForward";
import { changeNetwork } from "utils/changeNetwork";
import { selectChainId } from "store/chainIdSlice";
import { chainIds } from "chainIds";
import { selectDestAddress } from "store/destAddressSlice";
import { ERC20Abi, exportAssistantAbi, importAssistantAbi } from "abi";
import { addTokenToTracked, selectAddedTokens } from "store/addedTokensSlice";
import { sqrt } from "pages/Assistants/helpers/sqrt.js";
import { ChangeAddressModal } from "modals/ChangeAddressModal";
import { updateEvmAssistant } from "store/thunks/updateEvmAssistant";

const { Paragraph } = Typography;
const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

const environment = process.env.REACT_APP_ENVIRONMENT;

const MAX_UINT256 = ethers.BigNumber.from(2).pow(256).sub(1);
const fn1e4 = FixedNumber.from(1e4);

export const BuyAssistantSharesModal = ({ size, side, network, block, assistant_aa, forward, forward_status, shares_decimals, shares_supply = 0, shares_symbol, shares_asset, exponent = 1, stake_balance = 0, stake_asset_symbol = "STAKE", stake_asset_decimals, stake_balance_in_work = 0, stake_asset, image_asset, image_asset_decimals, image_balance = 0, image_asset_symbol = "IMPORTED", image_balance_in_work = 0, stake_mf = 0, stake_sf = 0, ts, success_fee, management_fee, stake_profit = 0, image_profit = 0, image_mf = 0, image_sf = 0, stake_share }) => {
  const [stakeAmount, setStakeAmount] = useState();
  const [imageAmount, setImageAmount] = useState();
  const [sharesAmount, setSharesAmount] = useState();
  const [minimizedFee, setMinimizedFee] = useState(side === "import" && !BigNumber.from(String(shares_supply)).isZero());
  const [inFocus, setInFocus] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [linkBuySharesForImportAssistants, setLinkBuySharesForImportAssistants] = useState();

  const [pendingTokens, setPendingTokens] = useState({});
  const stakeInputRef = useRef(null);
  const dispatch = useDispatch();

  const invite = useSelector(selectInvite);
  const chainId = useSelector(selectChainId);
  const addresses = useSelector(selectDestAddress);
  const addedTokens = useSelector(selectAddedTokens);

  const timestamp = Number(Date.now() / 1000).toFixed(0);

  useEffect(() => {
    setStakeAmount(undefined);
    setImageAmount(undefined);
    setSharesAmount(undefined);
  }, [isVisible]);

  useEffect(() => {
    window.addEventListener('focus', () => {
      setInFocus(true);
    });

    window.addEventListener('blur', () => {
      setInFocus(false);
    });
  }, []);

  useEffect(async () => {
    if (window.ethereum && inFocus && (chainId in pendingTokens)) {
      const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      const signer = window.ethereum && provider.getSigner();

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

  useEffect(() => {
    if (isVisible) {
      if (network === "Obyte") {
        if (side === "export") {
          if (stakeAmount !== undefined) {

            const received_stake_amount = stakeAmount * 10 ** stake_asset_decimals;
            const gross_balance = stake_balance + stake_balance_in_work;
            const scaled_mf = (timestamp - ts) / (360 * 24 * 3600) * management_fee;
            const delta_mf = gross_balance * scaled_mf;
            const mf = stake_mf + delta_mf;
            const sf = Math.max(Math.floor(stake_profit * success_fee), 0);
            const balance = gross_balance - mf - sf;


            const coef = Number(shares_supply) ? (shares_supply / get_shares({ stake_balance: balance, exponent, side })) : 1;
            const new_shares_supply = Math.floor(coef * (balance + received_stake_amount)); //get_shares({ stake_balance: balance + received_stake_amount, exponent, side })
            const shares_amount = new_shares_supply - shares_supply;

            setSharesAmount(+Number(shares_amount / 10 ** shares_decimals).toFixed(shares_decimals));
          }
        } else {
          const payments = [];

          if (Number(stakeAmount) > 0) {
            payments.push({ address: forward, amount: Math.floor(stakeAmount * 10 ** stake_asset_decimals), asset: stake_asset });
          }

          if (Number(imageAmount) > 0) {
            payments.push({ address: forward, amount: Math.floor(imageAmount * 10 ** image_asset_decimals), asset: image_asset });
          }

          if (stake_asset !== 'base' && image_asset !== 'base')
            payments.push({ address: forward, amount: 1e4 });

          const gross_stake_balance = (stake_balance - (stake_asset === "base" ? 1e4 : 0)) + stake_balance_in_work;
          const gross_image_balance = image_balance + image_balance_in_work;

          const scaled_mf = (timestamp - ts) / (360 * 24 * 3600) * management_fee;

          const delta_stake_mf = gross_stake_balance * scaled_mf;
          const delta_image_mf = gross_image_balance * scaled_mf;

          const stakeNetBalance = gross_stake_balance - (stake_mf + delta_stake_mf) - Math.max(Math.floor(stake_profit * success_fee), 0);
          const imageNetBalance = gross_image_balance - (image_mf + delta_image_mf) - Math.max(Math.floor(image_profit * success_fee), 0);

          const coef = Number(shares_supply) ? shares_supply / get_shares({ stake_balance: stakeNetBalance, image_balance: imageNetBalance, exponent, side, stake_share }) : 1;

          const new_shares_supply = Math.floor(coef * get_shares({ stake_balance: stakeNetBalance + ((stakeAmount || 0) * 10 ** stake_asset_decimals), image_balance: imageNetBalance + ((imageAmount || 0) * 10 ** image_asset_decimals), exponent, side, stake_share }));

          const amountPurchasedShares = +Number((new_shares_supply - shares_supply) / 10 ** shares_decimals).toFixed(shares_decimals);

          setSharesAmount(amountPurchasedShares);

          const paymentJsonBase64 = generatePaymentMessage({ payments });

          const message = `Buy ≈${amountPurchasedShares} ${shares_symbol || "shares"} \n[buy-shares](payment:${paymentJsonBase64})`;

          const requestId = randomBytes(32).toString('base64');

          texto.on('pairing', msg => {
            if (msg.body.pairing_secret === requestId) msg.reply(message);
          });

          setLinkBuySharesForImportAssistants(`${invite}#${requestId}`);
        }
      } else {
        const bnStakeAmount = (stakeAmount && Number(stakeAmount)) ? ethers.utils.parseUnits(Number(stakeAmount).toFixed(stake_asset_decimals), stake_asset_decimals) : 0;
        const bnImageAmount = (imageAmount && Number(imageAmount) && side === "import") ? ethers.utils.parseUnits(Number(imageAmount).toFixed(image_asset_decimals), image_asset_decimals) : 0;

        const bnSharesSupply = BigNumber.from(shares_supply);
        const decimals = Number(exponent) > 2 ? 9 : 18;

        if (side === "export") {
          if (bnStakeAmount) {
            if (bnSharesSupply.isZero()) {
              const bnSharesAmount = ethers.utils.formatUnits(bnStakeAmount, 18 - decimals);
              setSharesAmount(+Number(ethers.utils.formatUnits(bnSharesAmount, decimals).toString()).toFixed(decimals))
            } else {
              const getSharesBn = (balance) => {
                const bnBalance = FixedNumber.from(balance);
                if (Number(exponent) === 1) {
                  return bnBalance;
                } else if (Number(exponent) === 2) {
                  sqrt(bnBalance);
                } else if (Number(exponent) === 4) {
                  sqrt(sqrt(bnBalance));
                }
              }

              const bnGrossBalance = FixedNumber.from(stake_balance).addUnsafe(FixedNumber.from(stake_balance_in_work));

              const bnNewMf = FixedNumber.from(stake_mf).mulUnsafe(FixedNumber.from(management_fee * 1e4).divUnsafe(fn1e4)).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600));

              const bnNetBalance = bnGrossBalance.subUnsafe(bnNewMf).subUnsafe(FixedNumber.from(stake_profit).mulUnsafe(FixedNumber.from(success_fee * 1e4)).divUnsafe(fn1e4));

              const bnNewSharesSupply = FixedNumber.from(shares_supply).mulUnsafe(getSharesBn(bnNetBalance.addUnsafe(FixedNumber.from(bnStakeAmount)))).divUnsafe(getSharesBn(bnNetBalance));

              const bnSharesAmount = bnNewSharesSupply.subUnsafe(FixedNumber.from(shares_supply)).ceiling().toString().split(".")[0];

              const bnSharesAmountInBig = ethers.utils.formatUnits(bnSharesAmount, decimals);

              setSharesAmount(bnSharesAmountInBig.toString());
            }
          }
        } else {
          if (bnSharesSupply.isZero()) {
            const gm = sqrt(FixedNumber.from(bnStakeAmount.toString()).mulUnsafe(FixedNumber.from(bnImageAmount.toString())));
            let bnSharesAmount;
            if (Number(exponent) === 1) {
              bnSharesAmount = ethers.utils.formatUnits(gm, 18 - decimals);
            } else if (Number(exponent) === 2) {
              bnSharesAmount = ethers.utils.formatUnits(sqrt(gm), 18 - decimals);
            } else if (Number(exponent) === 4) {
              bnSharesAmount = ethers.utils.formatUnits(sqrt(sqrt(gm)), 18 - decimals);
            }

            setSharesAmount(+Number(ethers.utils.formatUnits(bnSharesAmount.toString(), decimals).toString()).toFixed(decimals))
          } else {

            const getSharesBnImp = (stake_balance, image_balance) => {
              const gm = sqrt(FixedNumber.from(String(stake_balance)).mulUnsafe(FixedNumber.from(String(image_balance))).toString());

              if (Number(exponent) === 1) {
                return gm;
              } else if (Number(exponent) === 2) {
                return sqrt(gm);
              } else if (Number(exponent) === 4) {
                return sqrt(sqrt(gm));
              }
            }

            const bnStakeGrossBalance = FixedNumber.from(stake_balance).addUnsafe(FixedNumber.from(stake_balance_in_work));
            const bnImageGrossBalance = FixedNumber.from(image_balance).addUnsafe(FixedNumber.from(image_balance_in_work));

            const bnStakeNewMf = FixedNumber.from(stake_mf).addUnsafe(bnStakeGrossBalance.mulUnsafe(FixedNumber.from(management_fee * 1e4)).divUnsafe(fn1e4).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)));
            const bnImageNewMf = FixedNumber.from(image_mf).addUnsafe(bnImageGrossBalance.mulUnsafe(FixedNumber.from(management_fee * 1e4)).divUnsafe(fn1e4).mulUnsafe(FixedNumber.from(timestamp - ts)).divUnsafe(FixedNumber.from(360 * 24 * 3600)));


            const bnStakeNetBalance = bnStakeGrossBalance.subUnsafe(bnStakeNewMf).subUnsafe(FixedNumber.from(stake_profit).isNegative ? FixedNumber.from("0") : FixedNumber.from(success_fee * 1e4).divUnsafe(fn1e4).mulUnsafe(FixedNumber(stake_profit)));
            const bnImageNetBalance = bnImageGrossBalance.subUnsafe(bnImageNewMf).subUnsafe(FixedNumber.from(image_profit).isNegative ? FixedNumber.from("0") : FixedNumber.from(success_fee * 1e4).divUnsafe(fn1e4).mulUnsafe(FixedNumber(image_profit)));

            const bnNewSharesSupply = FixedNumber.from(shares_supply).mulUnsafe(getSharesBnImp(bnStakeNetBalance.addUnsafe(FixedNumber.from(bnStakeAmount)), bnImageNetBalance.addUnsafe(FixedNumber.from(bnImageAmount)))).divUnsafe(getSharesBnImp(bnStakeNetBalance, bnImageNetBalance))

            const bnSharesAmount = bnNewSharesSupply.subUnsafe(FixedNumber.from(bnSharesSupply)).ceiling().toString().split(".")[0];

            const bnSharesAmountInBig = ethers.utils.formatUnits(bnSharesAmount, decimals).toString();

            setSharesAmount(bnSharesAmountInBig);
          }
        }
      }
    }
  }, [stakeAmount, imageAmount, assistant_aa, stake_mf, shares_supply]);

  const stakeHandleChange = (ev) => {
    const reg = /^[0-9.]+$/;
    if (reg.test(String(ev.target.value)) || ev.target.value === "") {
      if (f(ev.target.value) <= stake_asset_decimals) {
        if (!isNaN(ev.target.value) && Number(ev.target.value) <= 1e20) {
          setStakeAmount(ev.target.value);
          if (minimizedFee) {
            if (Number(ev.target.value) > 0) {
              const gross_stake_balance = Number(stake_balance) + Number(stake_balance_in_work);
              const gross_image_balance = Number(image_balance) + Number(image_balance_in_work);
              const stakeAmountInSmallestUnits = Number(ev.target.value) * 10 ** stake_asset_decimals;
              const imageAmountInSmallestUnits = ((gross_image_balance * stakeAmountInSmallestUnits) / gross_stake_balance);
              setImageAmount(+(imageAmountInSmallestUnits / 10 ** image_asset_decimals).toFixed(image_asset_decimals));
            } else {
              setImageAmount("");
            }
          }
        }
      }
    } else if (ev.target.value === "") {
      setStakeAmount(undefined);
    }
  }

  const imageHandleChange = (ev) => {
    const reg = /^[0-9.]+$/;
    if (reg.test(String(ev.target.value)) || ev.target.value === "") {
      if (f(ev.target.value) <= image_asset_decimals) {
        if (!isNaN(ev.target.value) && Number(ev.target.value) <= 1e20) {
          setImageAmount((ev.target.value));
          if (minimizedFee) {
            if (Number(ev.target.value) > 0) {
              const gross_stake_balance = Number(stake_balance) + Number(stake_balance_in_work);
              const gross_image_balance = Number(image_balance) + Number(image_balance_in_work);

              const imageAmountInSmallestUnits = Number(ev.target.value) * 10 ** image_asset_decimals;
              const stakeAmountInSmallestUnits = ((gross_stake_balance * imageAmountInSmallestUnits) / gross_image_balance);

              setStakeAmount(+Number(stakeAmountInSmallestUnits / 10 ** stake_asset_decimals).toFixed(stake_asset_decimals));
            } else {
              setStakeAmount("");
            }

          }
        }
      }
    } else if (ev.target.value === "") {
      setImageAmount(undefined);
    }
  }


  const linkBuySharesForExportAssistants = isVisible && network === "Obyte" && side === "export" ? generateLink({ amount: stakeAmount * 10 ** stake_asset_decimals, aa: assistant_aa, asset: stake_asset, data: { buy_shares: 1 } }) : undefined;

  const isValid = (!BigNumber.from(String(shares_supply)).isZero() || side === "export") ? (stakeAmount && Number(stakeAmount) > 0) || (imageAmount && Number(imageAmount) > 0) : stakeAmount && Number(stakeAmount) > 0 && imageAmount && Number(imageAmount) > 0;

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

  const addToken = async () => {
    if (!window.ethereum) // no metamask installed
      return;

    const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
    const signer = window.ethereum && provider.getSigner();

    const address = await signer.getAddress();

    const assistantChainId = chainIds[environment][network];

    const params = {
      type: 'ERC20',
      options: {
        address: shares_asset,
        symbol: shares_symbol,
        decimals: 18
      }
    };

    if (chainId === assistantChainId && !(addedTokens[address]?.[chainId] && (addedTokens[address]?.[chainId]?.includes(shares_symbol)))) {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params
      })
      if (wasAdded) {
        dispatch(addTokenToTracked({ address, chainId, symbol: shares_symbol }))
      }
    } else if (!pendingTokens[assistantChainId]) {
      setPendingTokens({ ...pendingTokens, [assistantChainId]: [params] })
    } else if (pendingTokens[assistantChainId] && !pendingTokens[assistantChainId].find((t) => t.options.symbol === params.options.symbol)) {
      setPendingTokens({ ...pendingTokens, [assistantChainId]: [...pendingTokens[assistantChainId], params] })
    };
  }

  const buySharesFromEVM = async () => {
    if (!window.ethereum || network === "Obyte") return;

    try {
      // login
      await loginEthereum();

      let provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      let signer = window.ethereum && provider.getSigner();

      const address = await signer.getAddress();

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

      const bnStakeAmount = (stakeAmount && Number(stakeAmount)) ? ethers.utils.parseUnits(Number(stakeAmount).toFixed(stake_asset_decimals), stake_asset_decimals) : 0;
      const bnImageAmount = (imageAmount && Number(imageAmount) && side === "import") ? ethers.utils.parseUnits(Number(imageAmount).toFixed(image_asset_decimals), image_asset_decimals) : 0;

      // approve
      await approve(bnStakeAmount, stake_asset);

      if (side === "import") {
        await approve(bnImageAmount, image_asset);
      }

      // send: create contact
      const assistantContact = new ethers.Contract(assistant_aa, side === "export" ? exportAssistantAbi : importAssistantAbi, signer);

      // send: call buyShares

      let res;
      if (side === "export") {
        if (stake_asset === ethers.constants.AddressZero) {
          res = await assistantContact.buyShares(bnStakeAmount, { value: bnStakeAmount });
        } else {
          res = await assistantContact.buyShares(bnStakeAmount);
        }
      } else {
        if (stake_asset === ethers.constants.AddressZero) {
          res = await assistantContact.buyShares(bnStakeAmount, bnImageAmount, { value: bnStakeAmount });
        } else {
          res = await assistantContact.buyShares(bnStakeAmount, bnImageAmount);
        }
      }
      await res?.wait();

      dispatch(updateEvmAssistant(assistant_aa));

      // add token in MetaMask
      if (!(addedTokens[address]?.[chainId] && (addedTokens[address]?.[chainId]?.includes(shares_symbol)))) {
        await addToken();
      }

    } catch (e) {
      console.log(e)
      dispatch(updateEvmAssistant(assistant_aa));
    }
  }

  const changeChecked = (e) => {
    setMinimizedFee(e.target.checked);
    const gross_stake_balance = Number(stake_balance) + Number(stake_balance_in_work);
    const gross_image_balance = Number(image_balance) + Number(image_balance_in_work);

    if (Number(stakeAmount) > 0) {
      const stakeAmountInSmallestUnits = stakeAmount * 10 ** stake_asset_decimals;
      const imageAmountInSmallestUnits = ((gross_image_balance * stakeAmountInSmallestUnits) / gross_stake_balance);
      setImageAmount(+Number(imageAmountInSmallestUnits / 10 ** image_asset_decimals).toFixed(image_asset_decimals));
    } else if (Number(imageAmount) > 0) {
      const imageAmountInSmallestUnits = imageAmount * 10 ** image_asset_decimals;
      const stakeAmountInSmallestUnits = ((gross_stake_balance * imageAmountInSmallestUnits) / gross_image_balance).toFixed(stake_asset_decimals);
      setStakeAmount(+Number(stakeAmountInSmallestUnits / 10 ** stake_asset_decimals).toFixed(stake_asset_decimals));
    }
  }

  return <div onClick={stopPropagation}>
    {addresses[network]
      ? <Button onClick={openModal} block={block} size={size} disabled={(network !== "Obyte" && !window.ethereum) || !addresses[network]}>Buy shares</Button>
      : <Tooltip title={<ChangeAddressModal network={network}>Please add your {String(network).toLowerCase()} wallet address</ChangeAddressModal>}>
        <Button onClick={openModal} block={block} size={size} disabled={(network !== "Obyte" && !window.ethereum) || !addresses[network]}>Buy shares</Button>
      </Tooltip>}

    <Modal title="Buy shares" visible={isVisible} onCancel={closeModal} footer={null} onClick={stopPropagation}>
      {!forward && side === "import" && network === "Obyte" ? <CreateForward assistant_aa={assistant_aa} forward_status={forward_status} /> : <>
        {(BigNumber.from(String(shares_supply)).isZero() && side === "import") && <Paragraph type="warning">
          Send both assets for the first issue
        </Paragraph>}
        <Form layout="vertical" onClick={stopPropagation}>
          <div><b>You send:</b></div>
          <Form.Item>
            <Input ref={stakeInputRef} placeholder="Amount in stake tokens" value={stakeAmount} onChange={stakeHandleChange} suffix={stake_asset_symbol} />
          </Form.Item>

          {side === "import" && <Form.Item>
            <Input placeholder="Amount in imported tokens" onChange={imageHandleChange} value={imageAmount} suffix={image_asset_symbol} />
          </Form.Item>}

          {side === "import" && !BigNumber.from(String(shares_supply)).isZero() && <div style={{ marginBottom: 20 }}><Checkbox checked={minimizedFee} onChange={changeChecked}>Proportional amounts</Checkbox></div>}

          <div><b>You get:</b></div>
          <Form.Item>
            <Input placeholder="Amount in shares" disabled={true} value={isValid ? sharesAmount : undefined} suffix={shares_symbol} />
          </Form.Item>
          {network === "Obyte" ? <QRButton type="primary" href={side === "export" ? linkBuySharesForExportAssistants : linkBuySharesForImportAssistants} disabled={!isValid}>Send {isValid ? <> {Number(stakeAmount) > 0 && <span>{+Number(stakeAmount).toFixed(6)} {stakeAmount && stake_asset_symbol} {Number(imageAmount) > 0 && "and"} </span>} {Number(imageAmount) > 0 && <span>{+Number(imageAmount).toFixed(6)} {imageAmount && image_asset_symbol}</span>}</> : null} </QRButton> : <Button type="primary" onClick={buySharesFromEVM} disabled={!isValid}>Send {isValid ? <> {Number(stakeAmount) > 0 && <span>{+Number(stakeAmount).toFixed(6)} {stakeAmount && stake_asset_symbol} {Number(imageAmount) > 0 && "and"} </span>} {Number(imageAmount) > 0 && <span>{+Number(imageAmount).toFixed(6)} {imageAmount && image_asset_symbol}</span>}</> : null}</Button>}
        </Form>
      </>}
    </Modal>
  </div>
}