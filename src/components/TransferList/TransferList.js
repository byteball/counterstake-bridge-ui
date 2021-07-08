import { Typography, Button } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import moment from "moment";

import { selectTransfers } from "store/transfersSlice";
import { Transfer } from "components/Transfer/Transfer";

const { Title } = Typography;

const numberOfDaysBeforeHiding = 1;

export const TransferList = () => {
  const transfers = useSelector(selectTransfers).slice().reverse();
  const [visibleOlder, setVisibleOlder] = useState(false);
  const recentTransfers = [];
  const olderTransfers = [];

  transfers.forEach((tr) => {
    const diff = moment().diff(moment(tr.ts), 'days');
    if (recentTransfers.length >= 5 && (tr.status === "claimed" || tr.status === "claim_confirmed") && diff > numberOfDaysBeforeHiding) {
      olderTransfers.push(tr);
    } else {
      recentTransfers.push(tr);
    }
  })

  return (<div style={{ marginTop: 50 }}>
    {transfers.length > 0 && (
      <Title style={{ marginTop: 50, marginBottom: 20 }} level={2}>
        Transfers
      </Title>
    )}

    {recentTransfers.length !== 0 ? recentTransfers.map(t => <Transfer key={'list-item' + t.txid} {...t} />) : null}

    {visibleOlder && olderTransfers.map(t => <Transfer key={'list-item' + t.txid} {...t} />)}

    {olderTransfers.length > 0 && <Button type="link" onClick={() => { setVisibleOlder(v => !v); }}>{visibleOlder ? "Hide" : "Show older transfers"}</Button>}
  </div>)
}