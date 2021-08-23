import { createAsyncThunk } from "@reduxjs/toolkit";
import { BigNumber } from "ethers";
import { EVMBridgeGovernance } from "pages/Governance/utils/EVMBridgeGovernance";

export const updateActiveGovernanceAA = createAsyncThunk(
  'update/updateActiveGovernanceAA',
  async (_, { getState }) => {
    const store = getState();
    const { bridge_network, selectedBridgeAddress: bridge_aa, voteTokenDecimals, stakeTokenDecimals } = store.governance;
    const walletAddress = store.destAddress[bridge_network];
    const EVM = new EVMBridgeGovernance(bridge_network, bridge_aa, voteTokenDecimals, walletAddress, stakeTokenDecimals);
    const paramsInfo = await EVM.initState(store.governance.type);
    let balances;
    
    if (walletAddress) {
      const balanceBn = await EVM.getBalance(walletAddress);
      balances = {
        [walletAddress]: BigNumber.from(balanceBn).toString()
      }
    }

    return {
      paramsInfo,
      balances
    }
  })