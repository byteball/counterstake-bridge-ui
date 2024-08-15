import { ArrowDownOutlined, ArrowUpOutlined, EditOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Statistic, Grid, Tooltip, Button } from "antd";
import { memo, useRef, useState, lazy, Suspense } from "react";
import useCollapsible from "react-hook-collapse";
import { useSelector } from "react-redux";

import { InfoTooltip } from "components/InfoTooltip/InfoTooltip";
import { ShowDecimalsValue } from "components/ShowDecimalsValue/ShowDecimalsValue";
import { useWindowSize } from "hooks/useWindowSize";
import { RedeemAssistantSharesModal } from "modals/RedeemAssistantShares/RedeemAssistantSharesModal";
import { descOfManagers } from "./descOfManagers";
import { AssistantManagerModal } from "modals/AssistantManagerModal";
import { SwapTokensModal } from "modals/SwapTokensModal";
import { getExplorerLink } from "utils/getExplorerLink";
import { selectDestAddress } from "store/destAddressSlice";
import { selectBalanceOfObyteWallet } from "store/assistantsSlice";
import { ChangeAddressModal } from "modals/ChangeAddressModal";

const BuyAssistantSharesModal = lazy(() => import('modals/BuyAssistantShares/BuyAssistantSharesModal'));

const max_display_decimals = 5;

const { useBreakpoint } = Grid;

export const AssistantItem = memo((props) => {
  const { APY, totalBalanceInUSD, assistant_aa, my_balance_of_shares, manager, network, side, stake_asset_symbol, stake_asset_decimals, image_asset_symbol, image_asset_decimals, shares_decimals, shares_symbol, shares_asset, stake_balance, image_balance, stake_balance_in_work = 0, image_balance_in_work = 0, success_fee, management_fee } = props;
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();
  const [width] = useWindowSize();
  const screens = useBreakpoint();
  const balanceOfObyteWallet = useSelector(selectBalanceOfObyteWallet);
  const addresses = useSelector(selectDestAddress);

  useCollapsible(ref, isOpen);

  const mySharesBalance = (network !== "Obyte" ? my_balance_of_shares : balanceOfObyteWallet?.[shares_asset]?.total) || 0;

  const SHProps = {
    network,
    max_decimals: max_display_decimals
  };

  let imagePrice;
  let stakePrice;

  if (side === "import" && image_balance !== undefined && stake_balance !== undefined) {
    imagePrice = Number(image_balance) !== 0 && Number(stake_balance) !== 0 ? (Number(image_balance) / (Number(stake_balance) + Number(stake_balance_in_work))) * 10 ** (stake_asset_decimals - image_asset_decimals) : 0;
    stakePrice = Number(image_balance) !== 0 && Number(stake_balance) !== 0 ? (Number(stake_balance) / (Number(image_balance) + Number(image_balance_in_work))) * 10 ** (image_asset_decimals - stake_asset_decimals) : 0;
  }

  const padding = 24;

  return <div style={{ marginTop: 20 }}>
    <Card
      bodyStyle={{ padding: 0 }}
      style={{ marginBottom: 20 }}
      id={assistant_aa}
    >
      <Row
        onClick={() => setIsOpen(!isOpen)}
        style={{
          paddingTop: padding,
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: padding,
          boxSizing: "border-box",
          cursor: "pointer"
        }}
      >
        <Col xs={{ span: 24 }} sm={{ span: 24 }}>
          <Row gutter={10} align="middle">
            <Col lg={{ span: 8 }} md={{ span: 24 }} sm={{ span: 24 }} style={{ marginBottom: width < 768 ? 15 : 0 }}>
              <Statistic
                value={<AssistantManagerModal network={network} manager={manager}>{(manager in descOfManagers ? descOfManagers[manager]?.name : manager.slice(0, 20) + "...")}</AssistantManagerModal>}
                formatter={formatter}
                title={<span style={{ fontWeight: 200 }}>Manager <InfoTooltip title="The pool’s manager who is responsible for claiming transfers and challenging fraudulent claims on behalf of the pool." /></span>}
                valueStyle={{ overflow: "hidden", width: "100%" }}
              />
            </Col>
            <Col lg={{ span: 6 }} md={{ span: 8 }} sm={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: width < 576 ? 15 : 0 }}>
              <Statistic
                value={<><ShowDecimalsValue value={Number(stake_balance) + Number(stake_balance_in_work)} decimals={stake_asset_decimals} {...SHProps} /> <span style={{ fontSize: 12 }}>{stake_asset_symbol}</span> {side === "import" && <span><br /> <ShowDecimalsValue value={Number(image_balance) + Number(image_balance_in_work)} decimals={image_asset_decimals} {...SHProps} /> <span style={{ fontSize: 12 }}>{image_asset_symbol}</span></span>}</>}
                formatter={formatter}
                title={<span style={{ fontWeight: 200 }}>Balances {(totalBalanceInUSD && Number(totalBalanceInUSD) >= 0.01) ? <span style={{ opacity: 0.7 }}>≈${Number(totalBalanceInUSD).toFixed(2)}</span> : null} <InfoTooltip title="The full capital contributed to the pool. Larger capital allows the pool to claim larger transfers." /></span>}
                valueStyle={{ overflow: "hidden", width: "100%" }}
              />
            </Col>
            <Col lg={{ span: 5 }} md={{ span: 8 }} sm={{ span: 12 }} xs={{ span: 24 }}>
              <Statistic
                value={Number(APY).toFixed(4)}
                title={<span style={{ fontWeight: 200 }}>APY <InfoTooltip title="Average APY of the pool calculated based on the growth of its share price since inception." /></span>}
                precision={2}
                valueStyle={APY !== 0 ? { color: APY !== 0 ? (APY > 0 ? '#3f8600' : "red") : "white" } : {}}
                prefix={APY !== 0 && (APY > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />)}
                suffix="%"
              />
            </Col>
            <Col lg={{ span: 5 }} md={{ span: 8 }} sm={{ span: 24 }} xs={{ span: 24 }}>
              <div style={{ display: "flex", justifyContent: screens.xs ? "center" : "flex-end", marginTop: width < 768 ? 15 : 0 }}>
                <Space direction={"vertical"} style={{ width: "100%" }}>
                  <Suspense fallback={<Button block={!screens.xs} size={width < 400 ? "small" : "medium"} disabled={true}>Buy shares</Button>}>
                    <BuyAssistantSharesModal block={!screens.xs} size={width < 400 ? "small" : "medium"} {...props} />
                  </Suspense>
                  <RedeemAssistantSharesModal block={!screens.xs} size={width < 400 ? "small" : "medium"} {...props} />
                  {side === "import" && <SwapTokensModal block={!screens.xs} size={width < 400 ? "small" : "medium"} {...props} />}
                </Space>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
      <div ref={ref} style={{ overflow: 'hidden', transition: '0.4s' }}>
        <Row gutter={10} align="middle" style={{
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: padding,
        }}>
          <Col lg={{ span: 4 }} md={{ span: 8 }} sm={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: width < 768 ? 15 : 0 }}>
            <Statistic
              loading={management_fee === undefined}
              title={<span style={{ fontWeight: 200 }}>Management fee <InfoTooltip title="Yearly fee charged by the manager for managing the pool." /></span>}
              value={management_fee * 100}
              valueStyle={{ overflow: "hidden", width: "100%" }}
              suffix="%"
            />
          </Col>
          <Col lg={{ span: 4 }} md={{ span: 8 }} sm={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: width <= 576 ? 15 : 0 }}>
            <Statistic
              loading={success_fee === undefined}
              title={<span style={{ fontWeight: 200 }}>Success fee <InfoTooltip title="Manager’s share of the pool’s profits." /></span>}
              value={success_fee * 100}
              valueStyle={{ overflow: "hidden", width: "100%" }}
              suffix="%"
            />
          </Col>

          <Col lg={{ span: 6 }} md={{ span: 8 }} sm={{ span: 12 }} xs={{ span: 24 }} style={{ marginBottom: width <= 576 ? 15 : 0 }}>
            <Statistic
              loading={stake_balance_in_work === undefined}
              formatter={formatter}
              title={<span style={{ fontWeight: 200 }}>Balance in work <InfoTooltip title="Capital that is currently tied up in claims and challenges. This is “at-risk” capital and it’s not included when redeeming the pool’s shares." /></span>}
              valueStyle={{ overflow: "hidden", width: "100%" }}
              value={<><ShowDecimalsValue value={stake_balance_in_work} decimals={stake_asset_decimals} {...SHProps} /> <span style={{ fontSize: 12 }}>{stake_asset_symbol}</span> {side === "import" && <span><br /> <ShowDecimalsValue value={image_balance_in_work} decimals={image_asset_decimals} {...SHProps} /> <span style={{ fontSize: 12 }}>{image_asset_symbol}</span></span>}</>}
            />
          </Col>
          <Col lg={{ span: 5 }} md={{ span: 8 }} sm={{ span: 12 }} xs={{ span: 24 }}>
            <Statistic
              loading={mySharesBalance === undefined}
              formatter={formatter}
              title={<span style={{ fontWeight: 200 }}>My shares balance <InfoTooltip title="The number of shares in your wallet." /></span>}
              valueStyle={{ overflow: "hidden", width: "100%" }}
              value={addresses[network] ? <><ShowDecimalsValue value={mySharesBalance} decimals={shares_decimals} {...SHProps} /> <span style={{ fontSize: 12 }}>{shares_symbol}</span> <br /> <Tooltip title={addresses[network]}><span className="evmHashOrAddress" style={{ fontSize: 14 }}>on {addresses[network]?.slice(0, 10)}...</span></Tooltip> <ChangeAddressModal network={network} action="Edit" currentAddress={addresses[network]}><EditOutlined title="Change address" /></ChangeAddressModal></> : <ChangeAddressModal network={network}>Add {network.toLowerCase()} wallet</ChangeAddressModal>}
            />
          </Col>
          {side === "import" && <Col lg={{ span: 5 }} md={{ span: 8 }} sm={{ span: 12 }} xs={{ span: 24 }} style={{ marginTop: width <= 576 && side === "import" ? 15 : 0 }}>
            <Statistic
              loading={stakePrice === undefined || imagePrice === undefined}
              formatter={formatter}
              title={<span style={{ fontWeight: 200 }}>Swap prices <InfoTooltip title={`The pool holds both ${image_asset_symbol} and ${stake_asset_symbol} and allows swaps between the two tokens.`} /></span>}
              valueStyle={{ overflow: "hidden", width: "100%" }}
              value={<>1 <span style={{ fontSize: 12 }}>{image_asset_symbol}</span> = {+Number(stakePrice).toPrecision(max_display_decimals)} <span style={{ fontSize: 12 }}>{stake_asset_symbol}</span> <br /> 1 <span style={{ fontSize: 12 }}>{stake_asset_symbol}</span> = {+Number(imagePrice).toPrecision(max_display_decimals)} <span style={{ fontSize: 12 }}>{image_asset_symbol}</span></>}
            />
          </Col>}
        </Row>
        <Row style={{
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: padding,
        }}>
          <div>
            <span style={{ fontWeight: 200 }}>Assistant address: </span>{" "}<a target="_blank" rel="noopener" className="evmHashOrAddress" href={getExplorerLink(network, assistant_aa, "address")}>{assistant_aa}</a>
          </div>
        </Row>
      </div>
    </Card>
  </div>
})

const formatter = (value) => value;