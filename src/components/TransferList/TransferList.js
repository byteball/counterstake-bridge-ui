import { Card, Row, Col, Steps, Typography, Badge, Button } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import { selectTransfers } from "store/transfersSlice";
import useCollapse from 'react-hook-collapse';
import { useRef } from "react";
import { useWindowSize } from "hooks/useWindowSize";
import { ArrowRightOutlined } from "@ant-design/icons";

const { Step } = Steps;
const { Title } = Typography;

const numberOfDaysUntilHiding = 1;

export const TransferList = () => {
  const transfers = useSelector(selectTransfers).slice().reverse();
  const [visibleLater, setVisibleLater] = useState(false);
  const actualTransfers = [];
  const laterTransfers = [];

  transfers.forEach((tr) => {
    const diff = moment().diff(moment(tr.ts), 'days');
    if (transfers.length >= 5 && (tr.status === "claimed" || tr.status === "claim_confirmed") && diff > numberOfDaysUntilHiding) {
      laterTransfers.push(tr);
    } else {
      actualTransfers.push(tr);
    }
  })

  return (<div style={{ marginTop: 50 }}>
    {transfers.length > 0 && (
      <Title style={{ marginTop: 50, marginBottom: 20 }} level={2}>
        List of transfers
      </Title>
    )}

    {actualTransfers.length !== 0 ? actualTransfers.map(t => {
      if (t.status === "claimed" || t.status === "claim_confirmed") {
        return <Badge.Ribbon key={'list-item' + t.txid} placement="start" style={{ top: 0 }} text="Already completed"> <Transfer key={t.txid} {...t} /> </Badge.Ribbon>
      } else {
        return <Transfer key={'list-item' + t.txid} {...t} />
      }
    }) : (laterTransfers.length > 0 ? <Card style={{ marginBottom: 24 }}>Actual transfers not found</Card> : null)}

    {visibleLater && laterTransfers.map(t => {
      if (t.status === "claimed" || t.status === "claim_confirmed") {
        return <Badge.Ribbon key={'list-item' + t.txid} placement="start" style={{ top: 0 }} text="Already completed"> <Transfer key={t.txid} {...t} /> </Badge.Ribbon>
      } else {
        return <Transfer key={'list-item' + t.txid} {...t} />
      }
    })}

    {laterTransfers.length > 0 && <Button type="link" onClick={() => { setVisibleLater(v => !v); }}>{visibleLater ? "Hide" : "Show late transfers"}</Button>}
  </div>)
}

const Transfer = ({ src_token, amount, dst_token, status, dest_address, reward, ts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();
  const [width] = useWindowSize();
  useCollapse(ref, isOpen);

  return <Card
    bodyStyle={{ padding: 0 }}
    style={{ marginBottom: 20, cursor: "pointer" }}
    onClick={() => setIsOpen(!isOpen)}
  >
    <Row
      gutter="10"
      align="middle"
      style={{
        paddingTop: 24,
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 24
      }}
    >

      <Col
        lg={{ span: 8 }}
        md={{ span: 24 }}
        sm={{ span: 24 }}
        xs={{ span: 24 }}
        style={{ fontSize: 16, paddingBottom: width < 990 ? 20 : 0, paddingTop: width < 990 ? 5 : 0 }}
      >
        <span>{amount} {src_token.symbol}: {src_token.network}</span> <ArrowRightOutlined /> {dst_token.network}
      </Col>
      <Col
        lg={{ span: 16 }}
        md={{ span: 16 }}
        sm={{ span: 24 }}
        xs={{ span: 24 }}>
        <Steps size="small" direction={width >= 990 ? "horizontal" : "vertical"} current={getStatusLabel(src_token.network, status)}>
          {
            src_token.network === "Obyte" ? <>
              <Step title="Sent" />
              <Step title="Confirmed" />
              <Step title="Claimed" />
              <Step title="Claim confirmed" />
            </> :
              <>
                <Step title="Sent" />
                <Step title="Mined" />
                <Step title="Claimed" />
                <Step title="Claim confirmed" />
              </>
          }
        </Steps>
      </Col>
    </Row>
    <div ref={ref} style={{ overflow: 'hidden', transition: '0.4s' }}>
      <Row>
        <Col
          lg={12}
          sm={{ span: 24 }}
          xs={{ span: 24 }}
        >
          <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
            <b>Recipient address</b>: <div>{dest_address}</div>
          </div>
        </Col>
        <Col
          lg={6}
          sm={{ span: 24 }}
          xs={{ span: 24 }}>
          <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all" }}>
            <b>You get</b>: <div>{amount - reward}</div>
          </div>
        </Col>

        <Col lg={6}
          sm={{ span: 24 }}
          xs={{ span: 24 }}>
          <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24, wordBreak: "break-all"}}>
            <b>Created</b>: <div>{moment.unix(ts / 1000).format("LLL")}</div>
          </div>
        </Col>
      </Row>
    </div>
  </Card >
}

export const getStatusLabel = (network, status) => {
  if (network === "Obyte") {
    const index = ["sent", "confirmed", "claimed"].findIndex((s) => s === status)
    return index === 2 ? 3 : index
  } else {
    return ["sent", "mined", "claimed", "claim_confirmed"].findIndex((s) => s === status)
  }
}