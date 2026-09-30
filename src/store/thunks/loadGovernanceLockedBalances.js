import { createAsyncThunk } from "@reduxjs/toolkit";

import { getEvmGovernanceLockedBalances, getObyteGovernanceLockedBalance } from "utils/getGovernanceLockedBalances";
import { promiseAllWithConcurrency } from "utils/promiseAllWithConcurrency";

import {
  lockedBalancesLoadStarted,
  setGovernanceAddresses,
  updateLockedBalances,
} from "../governanceSlice";

const OBYTE_CONCURRENCY = 10;

const groupByNetwork = (exportList, importList) => {
  const byNetwork = {};
  for (const aa of [...Object.values(exportList || {}), ...Object.values(importList || {})]) {
    if (!aa?.bridge_aa || !aa.network) continue;
    (byNetwork[aa.network] = byNetwork[aa.network] || []).push(aa);
  }
  return byNetwork;
}

// identity of a load: results tagged with another key are stale and dropped
export const walletsKey = (destAddress) => JSON.stringify(
  Object.entries(destAddress || {}).filter(([, address]) => !!address).sort(([a], [b]) => (a < b ? -1 : 1))
);

export const loadGovernanceLockedBalances = createAsyncThunk(
  'governance/loadLockedBalances',
  async (_, { dispatch, getState }) => {
    const { governance, destAddress } = getState();
    const byNetwork = groupByNetwork(governance.exportList, governance.importList);
    const key = walletsKey(destAddress);

    dispatch(lockedBalancesLoadStarted(key));

    const emit = (updates) => {
      const balances = Object.fromEntries([].concat(updates).filter(({ status }) => status === 'succeeded').map(({ bridge_aa, value }) => [bridge_aa, value]));
      if (Object.keys(balances).length) dispatch(updateLockedBalances({ walletsKey: key, balances }));
    }

    const cacheGovernanceAddresses = (map) => {
      const fresh = Object.fromEntries(Object.entries(map || {}).filter(([bridge_aa, address]) => address && !governance.governanceAddresses[bridge_aa]));
      if (Object.keys(fresh).length) dispatch(setGovernanceAddresses(fresh));
    }

    const networks = Object.keys(byNetwork).filter((network) => !!destAddress[network]);

    const evmStage = Promise.all(networks.filter((network) => network !== 'Obyte').map((network) =>
      getEvmGovernanceLockedBalances(network, byNetwork[network], destAddress[network], governance.governanceAddresses)
        .then(({ governanceAddresses, updates }) => {
          cacheGovernanceAddresses(governanceAddresses);
          emit(updates);
        })
    ));

    const obyteStage = networks.includes('Obyte')
      ? promiseAllWithConcurrency(
        byNetwork.Obyte.map(({ bridge_aa }) => () =>
          getObyteGovernanceLockedBalance({ bridge_aa, governance_aa: governance.governanceAddresses[bridge_aa] }, destAddress.Obyte)
            .then(({ governance_aa, ...update }) => {
              if (governance_aa) cacheGovernanceAddresses({ [bridge_aa]: governance_aa });
              emit(update);
            })
        ),
        OBYTE_CONCURRENCY
      )
      : Promise.resolve();

    await Promise.all([evmStage, obyteStage]);
  }
);
