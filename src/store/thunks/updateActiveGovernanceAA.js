import { createAsyncThunk } from "@reduxjs/toolkit";
import { BigNumber } from "ethers";
import { EVMBridgeGovernance } from "pages/Governance/utils/EVMBridgeGovernance";

export const updateActiveGovernanceAA = createAsyncThunk(
  'update/updateActiveGovernanceAA',
  async (_, { getState }) => {
    const store = getState();
    const { bridge_network, active: bridge_aa, voteTokenDecimals, stakeTokenDecimals } = store.governance;
    const addressWallet = store.destAddress[bridge_network];
    const EVM = new EVMBridgeGovernance(bridge_network, bridge_aa, voteTokenDecimals, addressWallet, stakeTokenDecimals);
    const paramsInfo = await EVM.initState(store.governance.type);
    let balances;
    
    if (addressWallet) {
      const balancesBn = await EVM.getBalance(addressWallet);
      balances = {
        [addressWallet]: BigNumber.from(balancesBn).toString()
      }
    }

    return {
      paramsInfo,
      balances
    }
  })