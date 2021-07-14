import { Card, Row, Col, Steps, Button, Statistic, Badge, message } from "antd";
import { useState, useEffect, Fragment } from "react";
import useCollapse from 'react-hook-collapse';
import { useRef } from "react";
import { ethers } from "ethers";
import moment from "moment";
import QRButton from "obyte-qr-button";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRightOutlined } from "@ant-design/icons";

import { useWindowSize } from "hooks/useWindowSize";
import { getExplorerLink } from "utils/getExplorerLink";
import { SelfClaim } from "modals/SelfClaim";
import { generateLink, getStatusIndex } from "utils";
import { getClaim } from "utils/getClaim";
import { updateExpireTs, updateTransferStatus, withdrawalConfirmed } from "store/transfersSlice";
import { EllipsisIcon } from "components/EllipsisIcon/EllipsisIcon";
import { LineIcon } from "components/LineIcon/LineIcon";
import { selectChainId } from "store/chainIdSlice";
import { chainIds } from "chainIds";
import { changeNetwork } from "utils/changeNetwork";

const { Step } = Steps;
const { Countdown } = Statistic;

const environment = process.env.REACT_APP_ENVIRONMENT;
const numberOfMinutesWaitingForMoreConfirmations = 5;

export const Transfer = (t) => {
  const { src_token, amount, dst_token, status, dest_address, reward, ts, txid, claim_txid, dst_bridge_aa, self_claimed, self_claimed_num, is_finished, ts_confirmed, expiry_ts } = t;
  const [isOpen, setIsOpen] = useState(false);
  const [alreadyExpired, setAlreadyExpired] = useState(false);
  const [endedWaitingForConfirmation, setEndedWaitingForConfirmation] = useState(dst_token.network === "Obyte" || (Date.now() > (ts_confirmed + numberOfMinutesWaitingForMoreConfirmations * 60 * 1000)))
  const chainId = useSelector(selectChainId);
  const ref = useRef();
  const [width] = useWindowSize();
  const dispatch = useDispatch();
  useCollapse(ref, isOpen);
  const min_decimals = Math.min(dst_token.decimals, src_token.decimals);

  useEffect(async () => {
    if (self_claimed_num && !expiry_ts) {
      try {
        const claim = await getClaim(self_claimed_num, dst_bridge_aa, dst_token.network, is_finished);
        dispatch(updateExpireTs({ txid, expiry_ts: claim?.expiry_ts }))
      } catch (e) {
        console.log(e)
      }
    }
  }, [self_claimed_num, expiry_ts])

  useEffect(() => {
    if (endedWaitingForConfirmation && ts_confirmed) {
      setEndedWaitingForConfirmation(Date.now() > (ts_confirmed + numberOfMinutesWaitingForMoreConfirmations * 60 * 1000));
    }
  }, [isOpen, ts_confirmed]);

  const handleWithdraw = async () => {
    if (!self_claimed_num || !window.ethereum) return;

    try {
      let provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);
      let signer = window.ethereum && provider.getSigner();

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const destinationChainId = chainIds[environment][dst_token.network];

      const metaMaskAddress = await signer.getAddress();
      if (dest_address !== metaMaskAddress) return message.error(`The wallet address in metamask is different from the recipient. Please select the ${dest_address.slice(0, 10)}... account.`)

      let contract = new ethers.Contract(dst_bridge_aa, ['function withdraw(uint claim_num) external'], signer);

      if (!chainId || chainId !== destinationChainId) {
        await changeNetwork(dst_token.network)

        provider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum);

        signer = window.ethereum && provider.getSigner();

        contract = new ethers.Contract(dst_bridge_aa, ['function withdraw(uint claim_num) external'], signer);

        if (!contract)
          throw Error(`no contract by bridge AA ${dst_bridge_aa}`);

        const { chainId } = await provider.getNetwork();

        if (!chainId || chainId !== destinationChainId) return null;
      }

      const res = await contract.withdraw(self_claimed_num);
      dispatch(updateTransferStatus({ txid, status: "withdrawn" }));
      try {
        await res.wait();
        dispatch(updateTransferStatus({ txid, status: "withdrawal_confirmed" }))
        dispatch(withdrawalConfirmed({ txid }))
      } catch (e) {
        console.log('wait failed');
        if (e.code === 'TRANSACTION_REPLACED') {
          if (e.cancelled) {
            console.log(`withdraw cancelled`);
          }
          else {
            dispatch(updateTransferStatus({ txid, status: "withdrawal_confirmed" }))
            dispatch(withdrawalConfirmed({ txid }))
          }
        }
      }
    } catch (e) {
      console.log("Withdraw ERROR", e)
    }
  }

  const data = { withdraw: 1, claim_num: self_claimed_num };
  const withdrawFromObyteLink = dest_address && dst_bridge_aa && self_claimed_num && generateLink({ amount: 1e4, data, from_address: dest_address, aa: dst_bridge_aa, asset: "base" });
  const expired = is_finished || alreadyExpired || (expiry_ts * 1000) < Date.now();
  const showBadge = (t.status && (t.self_claimed ? Boolean(t.is_finished) : (t.status === "claim_confirmed")));

  const Wrapper = showBadge ? Badge.Ribbon : Fragment;
  const wrapperProps = showBadge ? { placement: "start", style: { top: 0 }, text: "Finished" } : {}

  return <Wrapper {...wrapperProps}>
    <Card
      bodyStyle={{ padding: 0 }}
      style={{ marginBottom: 20 }}
    >
      <Row
        gutter="10"
        align="middle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          paddingTop: 24,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 24,
          boxSizing: "border-box",
          cursor: "pointer"
        }}
      >
        <Col
          lg={{ span: 8 }}
          md={{ span: 24 }}
          sm={{ span: 24 }}
          xs={{ span: 24 }}
          style={{ fontSize: 16, paddingBottom: width < 992 ? 20 : 0, paddingTop: width < 992 ? 5 : 0 }}
        >
          <span>{amount} {src_token.symbol}: {src_token.network}</span> <ArrowRightOutlined /> {dst_token.network}
        </Col>
        <Col
          lg={{ span: 16 }}
          md={{ span: 16 }}
          sm={{ span: 24 }}
          xs={{ span: 24 }}>
          <Steps size="small" labelPlacement={width > 1100 ? "horizontal" : "vertical"} direction={width >= 992 ? "horizontal" : "vertical"} current={!is_finished ? getStatusIndex(src_token.network, status) : 5}>
            {
              src_token.network === "Obyte" ? <>
                <Step title="Sent" />
                <Step title="Confirmed" />
                <Step title="Claimed" />
                <Step title="Claim confirmed" />
                {self_claimed && (width >= 992 ? <Step icon={isOpen ? <LineIcon /> : <EllipsisIcon />} /> : <>
                  <Step title="Withdrawn" />
                  <Step title="Withdrawal confirmed" />
                </>)}
              </> :
                <>
                  <Step title="Sent" />
                  <Step title="Mined" />
                  <Step title="Claimed" />
                  <Step title="Claim confirmed" />
                  {self_claimed && (width >= 992 ? <Step icon={isOpen ? <LineIcon /> : <EllipsisIcon />} /> : <>
                    <Step title="Withdrawn" />
                    <Step title="Withdrawal confirmed" />
                  </>)}
                </>
            }
          </Steps>
        </Col>
      </Row>
      <div ref={ref} style={{ overflow: 'hidden', transition: '0.4s' }}>
        {self_claimed && width >= 992 &&
          <Row style={{
            paddingLeft: 28,
            paddingRight: 24,
            paddingBottom: 24,
          }}>
            <Col lg={{ span: width >= 1300 ? 9 : 12, offset: 8 }} >
              <Steps size="small" initial={4} labelPlacement={width > 1100 ? "horizontal" : "vertical"} direction={width >= 992 ? "horizontal" : "vertical"} current={!is_finished ? getStatusIndex(src_token.network, status) : 5}>
                <Step title="Withdrawn" />
                <Step title="Withdrawal confirmed" />
              </Steps>
            </Col>
          </Row>}
        <Row>
          <Col
            lg={12}
            sm={{ span: 24 }}
            xs={{ span: 24 }}
          >
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>Recipient address</b>: <div style={{ fontFamily: "-apple-system, Roboto, Arial, sans-serif" }}>{dest_address}</div>
            </div>
          </Col>
          <Col
            lg={6}
            sm={{ span: 24 }}
            xs={{ span: 24 }}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>You get</b>: <div>{+Number(t.self_claimed ? amount : amount - reward).toFixed(min_decimals)}</div>
            </div>
          </Col>

          <Col lg={6}
            sm={{ span: 24 }}
            xs={{ span: 24 }}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>Created</b>: <div>{moment.unix(ts / 1000).format("LLL")}</div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg={12}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>Sent in</b>: <div style={{ fontFamily: "-apple-system, Roboto, Arial, sans-serif" }}><a href={getExplorerLink(src_token.network, txid)} target="_blank" rel="noopener">{txid}</a></div>
            </div>
          </Col>
          {claim_txid && <Col lg={12}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
              <b>Claimed in</b>: <div style={{ fontFamily: "-apple-system, Roboto, Arial, sans-serif" }}><a href={getExplorerLink(dst_token.network, claim_txid)} target="_blank" rel="noopener">{claim_txid}</a></div>
            </div>
          </Col>}
          {((status === "confirmed" || status === "mined") || ((status === "claim" || status === "claim_confirmed") && self_claimed && !is_finished)) && <Col lg={{ offset: 12, span: 12 }} sm={{ span: 24 }}
            xs={{ span: 24 }}>
            <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all", textAlign: width >= 992 ? "right" : "left" }}>
              {(status === "confirmed" || status === "mined") && ((ts_confirmed && (!endedWaitingForConfirmation || (Date.now() < (ts_confirmed + numberOfMinutesWaitingForMoreConfirmations * 60 * 1000)))) ? <Countdown title="Waiting for more confirmations" value={ts_confirmed + numberOfMinutesWaitingForMoreConfirmations * 60 * 1000} onFinish={() => setEndedWaitingForConfirmation(true)} /> : <SelfClaim {...t} />)}
              {expiry_ts && (status === "claimed" || status === "claim_confirmed") && (!expired ? <Countdown title="Time until withdrawal" value={expiry_ts * 1000} onFinish={() => setAlreadyExpired(true)} /> : (dst_token.network === "Obyte" ? <QRButton href={withdrawFromObyteLink}>Withdraw</QRButton> : <Button onClick={handleWithdraw}>Withdraw</Button>))}
            </div>
          </Col>}
        </Row>
      </div>
    </Card>
  </Wrapper>
}