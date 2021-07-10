import { Modal, Button, Spin, message } from "antd";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import QRButton from "obyte-qr-button";
import { isEmpty, isEqual } from "lodash";
import { useSelector } from "react-redux";

import { getRequiredStake } from "services/evm";
import { store } from "index";
import { generateLink, getDecimals, getSymbol, getTxtsByHash, getChallengingPeriodEVM, getRequiredStakeObyte } from "utils";
import { selectChainId } from "store/chainIdSlice";
import { chainIds } from "chainIds";

const counterstakeAbi = [
  "function claim(string memory txid, uint32 txts, uint amount, int reward, uint stake, string memory sender_address, address payable recipient_address, string memory data) payable external"
];

const environment = process.env.REACT_APP_ENVIRONMENT;
const provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);

export const SelfClaim = ({ txid, amount, dst_token, sender_address, reward, dst_bridge_aa, dest_address, src_token, txts: txtsCache}) => {
  const { bridges, directions, } = store.getState();
  const { network: dst_network } = dst_token;
  const chainId = useSelector(selectChainId);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stake, setStake] = useState({ amount: undefined, asset: undefined, decimals: undefined, symbol: undefined, txts: undefined, challenging_period: undefined  });

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };



  useEffect(async () => {
    if (isEmpty(directions) || isEmpty(bridges) || !dst_bridge_aa) return;

    const directions_aa = Object.keys(directions).find((d) => isEqual(directions[d].dst_token, dst_token) && isEqual(directions[d].src_token, src_token));

    if (!directions_aa) return;

    const direction = directions[directions_aa];

    const { stake_asset: st_asset, type } = direction || {};

    const stake_asset = type === 'expatriation' ? st_asset : dst_token.asset;

    if (isModalVisible && dst_network !== "Obyte") {

      const decimals = await getDecimals(stake_asset, dst_network);

      const bnAmount = ethers.utils.parseUnits(Number(amount).toFixed(decimals), decimals);

      let stake = await getRequiredStake(dst_bridge_aa, dst_network, bnAmount, txid);

      const challenging_period = await getChallengingPeriodEVM(0, stake, dst_network, dst_bridge_aa);
      const challenging_period_in_hours = BigNumber.from(challenging_period).toNumber() / 3600;

      const symbol = await getSymbol(stake_asset, dst_network);

      const txts = await getTxtsByHash(txid, src_token.network);

      if (type === 'expatriation') // we use oracle price, which might change, add 10%
        stake = stake.mul(110).div(100);

      setStake({ amount: stake.toString(), asset: stake_asset, challenging_period: challenging_period_in_hours, decimals, symbol, txts });

    } else if (isModalVisible) {
      const stake = await getRequiredStakeObyte(dst_bridge_aa, Math.round(amount * 10 ** dst_token.decimals))
      const txts = txtsCache || await getTxtsByHash(txid, src_token.network);

      if (bridges.exportParams[dst_bridge_aa]) {
        //repatriation
        const symbol = await getSymbol(dst_token.asset, dst_network);
        const params = bridges.exportParams[dst_bridge_aa];

        if (!params) return;

        const challenging_period = stake >= params.large_threshold ? params.large_challenging_periods[0] : params.challenging_periods[0];

        setStake({ amount: stake + (dst_token.asset === "base" ? 2000 : 0), asset: dst_token.asset, decimals: dst_token.decimals, symbol, txts, challenging_period });
      } else if (bridges.importParams[dst_bridge_aa]) {
        //expatriation
        const symbol = await getSymbol(stake_asset, dst_network);
        const params = bridges.importParams[dst_bridge_aa];

        if (!params || !stake_asset) return;

        const challenging_period = stake >= params.large_threshold ? params.large_challenging_periods[0] : params.challenging_periods[0];

        setStake({ amount: stake * 1.1 + (stake_asset === "base" ? 2000 : 0), asset: stake_asset, decimals: params.stake_asset_decimals, symbol, txts, challenging_period });
      }

    }
  }, [isModalVisible, amount, bridges, directions]);


  if (!isModalVisible) return <Button style={{ padding: 0, color: "#FAAD14" }} type="link" onClick={showModal}>I claim myself</Button>;

  const min_decimals = Math.min(dst_token.decimals, src_token.decimals);

  const newClaim = async () => {
    if (dst_network === "Obyte") return;

    const destinationChainId = chainIds[environment][dst_network];
    if (!chainId || chainId !== destinationChainId) return message.error(`Wrong network selected, please select ${dst_network} in MetaMask`);

    const bnAmount = ethers.utils.parseUnits(Number(amount).toFixed(min_decimals), dst_token.decimals);
    const bnReward = ethers.utils.parseUnits(Number(reward).toFixed(min_decimals), dst_token.decimals);

    const data = {}

    const stakeValue = stake.amount;

    try {
      const signer = window.ethereum && provider.getSigner();
      if (!signer) return;

      const contract = new ethers.Contract(dst_bridge_aa, counterstakeAbi, signer);

      if (!contract)
        throw Error(`no contract by bridge AA ${dst_bridge_aa}`);

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const metaMaskAddress = await signer.getAddress();
      if (dest_address !== metaMaskAddress) return message.error(`The wallet address in metamask is different from the recipient. Please select the ${dest_address.slice(0, 10)}... account.`)

      await contract.claim(txid, stake.txts, bnAmount, bnReward, stakeValue, sender_address, dest_address, data, (stake.asset === ethers.constants.AddressZero) ? { value: stakeValue } : { value: 0 });
    } catch (e) {
      console.log(e)
    }

  }

  const href = (dst_network === "Obyte" && stake.amount) ? generateLink({
    amount: Math.ceil(stake.amount),
    asset: stake.asset,
    data: {
      sender_address,
      amount: Math.round(amount * 10 ** dst_token.decimals),
      reward: Math.round(reward * 10 ** dst_token.decimals),
      txid,
      txts: stake.txts,
    },
    from_address: dest_address,
    aa: dst_bridge_aa
  }) : undefined;

  const stakeAmountView = stake.amount && stake.decimals ? +Number(stake.amount / 10 ** stake.decimals).toFixed(stake.decimals) : 0;

  return <>
    <Button style={{ padding: 0, color: "#FAAD14" }} type="link" onClick={showModal}>I claim myself</Button>
    <Modal loading={!stake} footer={(stake.asset && stake.amount) ? (dst_network === "Obyte" ? <div style={{ textAlign: "right" }}><QRButton type="primary" loading={!stake?.amount} style={{ margin: 0 }} href={href}>Self-claim this transfer</QRButton> </div> : <Button type="primary" onClick={newClaim} loading={!stake?.amount}>Self-claim this transfer</Button>) : null} title="I claim myself" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
      {stake.asset && stake.amount ? <>
        <p>You can claim the transfer yourself if no assistant is able/willing to help you with this transfer. You will have to stake your own money {stakeAmountView} <span style={{ fontFamily: "-apple-system, Roboto, Arial, sans-serif" }}>{stake.symbol || stake.asset}</span>.</p>
        <p>If the claim is successful, you will get back both the staked money and the transferred amount in {stake?.challenging_period ? `${stake?.challenging_period} hours` : "[loading]"}. Your claim can be challenged during this period if it doesn't exactly match the initial transfer, which can happen due to bugs, and this app makes no guarantees that there aren't any. Use at your own risk.</p>
      </> : <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" />
      </div>}
    </Modal>
  </>
}