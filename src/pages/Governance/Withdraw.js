import { Typography } from "antd";

import { ChangeAddressModal } from "modals/ChangeAddressModal";
import { WithdrawGovernanceSupportModal } from "modals/WithdrawGovernanceSupportModal";

const { Text } = Typography;

export const Withdraw = ({ voteTokenSymbol, balance = 0, voteTokenDecimals, choiceParams = [], currentAddress, activeGovernance, bridge_network, selectedAddress }) => {
  const metamaskInstalledOrNotRequired = bridge_network === "Obyte" || window.ethereum;

  return (
    <div style={{ marginTop: 10, marginBottom: 30 }} size="small">
      {currentAddress ? <>
        <div>
          Your voting address is <ChangeAddressModal action="Change" currentAddress={currentAddress} network={bridge_network}><span className="evmHashOrAddress" style={{ borderBottom: "1px dashed" }}>{currentAddress}</span></ChangeAddressModal>
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={{ marginRight: 5 }}>Locked balance: {balance / 10 ** voteTokenDecimals} {voteTokenSymbol || "TOKEN"}</span>{currentAddress && <WithdrawGovernanceSupportModal
            voteTokenSymbol={voteTokenSymbol}
            voteTokenDecimals={voteTokenDecimals}
            bridge_network={bridge_network}
            max={balance}
            selectedAddress={selectedAddress}
            activeGovernance={activeGovernance}
            activeWallet={currentAddress}
            disabled={!currentAddress || choiceParams?.length > 0 || balance === 0 || balance === "0" || !metamaskInstalledOrNotRequired}
            choiceParams={choiceParams}
          >
            Withdraw
          </WithdrawGovernanceSupportModal>}
        </div>
      </> : <Text type="warning">Your balance on the governance {bridge_network === "Obyte" ? "autonomous agent" : "contract"} will be shown after you <ChangeAddressModal network={bridge_network}><span className="evmHashOrAddress" style={{ borderBottom: "1px dashed"}}>add your address</span></ChangeAddressModal>.</Text>}
    </div>
  )
}