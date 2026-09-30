import { BigNumber, ethers } from "ethers";

import { counterstakeAbi, governanceAbi, multicallAbi } from "abi";
import { providers } from "services/evm";
import obyte from "services/socket";

import { getMultiCallAddress } from "./getMulticallAddress";
import { getEvmErrorMessage } from "./handleEvmError";
import { withTimeout } from "./withTimeout";

const bridgeIface = new ethers.utils.Interface(counterstakeAbi);
const govIface = new ethers.utils.Interface(governanceAbi);

const EVM_BATCH_TIMEOUT = 30 * 1000;
const OBYTE_TIMEOUT = 20 * 1000;

const ok = (bridge_aa, value, extra) => ({ bridge_aa, status: "succeeded", value, ...extra });
const failed = (bridge_aa, error) => ({ bridge_aa, status: "failed", error });

// Two multicalls per network: governance() on each bridge (skipped for known addresses), then
// balances(wallet) on each governance contract. Never throws: failures become `failed` updates.
export const getEvmGovernanceLockedBalances = async (network, aas, wallet, knownGovernanceAddresses = {}) => {
  const governanceAddresses = {};
  if (!aas.length) return { governanceAddresses, updates: [] };

  const failAll = (message) => ({ governanceAddresses, updates: aas.map(({ bridge_aa }) => failed(bridge_aa, message)) });

  let multicall;
  try {
    const provider = providers[network];
    if (!provider) return failAll(`no RPC provider configured for ${network}`);
    const multicallContract = new ethers.Contract(getMultiCallAddress(network), multicallAbi, provider);
    multicall = (calls, label) => withTimeout(multicallContract.callStatic.tryAggregate(false, calls), EVM_BATCH_TIMEOUT, `${network} ${label}`);
  } catch (e) {
    console.log(`governance: multicall is not available on ${network}`, e);
    return failAll(e.message || `read on ${network} failed`);
  }

  const updates = [];

  const unknown = aas.filter(({ bridge_aa }) => !knownGovernanceAddresses[bridge_aa]);
  if (unknown.length) {
    let results;
    try {
      results = await multicall(unknown.map(({ bridge_aa }) => ({
        target: bridge_aa,
        callData: bridgeIface.encodeFunctionData("governance"),
      })), "governance() multicall");
    } catch (e) {
      console.log(`governance: governance() multicall on ${network} failed`, e);
      return failAll(getEvmErrorMessage(e) || e.message || `read on ${network} failed`);
    }

    unknown.forEach(({ bridge_aa }, i) => {
      const result = results[i];
      try {
        if (!result || !result.success) throw new Error(`governance() call failed on ${network}`);
        const address = bridgeIface.decodeFunctionResult("governance", result.returnData)[0];
        if (!address || address === ethers.constants.AddressZero) throw new Error(`no governance contract for ${bridge_aa}`);
        governanceAddresses[bridge_aa] = address;
      } catch (e) {
        console.log(`governance: failed to resolve the governance contract of ${bridge_aa}`, e);
        updates.push(failed(bridge_aa, e.message));
      }
    });
  }

  const resolved = aas
    .map(({ bridge_aa }) => ({ bridge_aa, governance: knownGovernanceAddresses[bridge_aa] || governanceAddresses[bridge_aa] }))
    .filter(({ governance }) => governance);

  if (!resolved.length) return { governanceAddresses, updates };

  let results;
  try {
    results = await multicall(resolved.map(({ governance }) => ({
      target: governance,
      callData: govIface.encodeFunctionData("balances", [wallet]),
    })), "balances() multicall");
  } catch (e) {
    console.log(`governance: balances() multicall on ${network} failed`, e);
    const message = getEvmErrorMessage(e) || e.message || `read on ${network} failed`;
    return { governanceAddresses, updates: [...updates, ...resolved.map(({ bridge_aa }) => failed(bridge_aa, message))] };
  }

  resolved.forEach(({ bridge_aa }, i) => {
    const result = results[i];
    if (!result || !result.success)
      return updates.push(failed(bridge_aa, `balances() call failed on ${network}`));

    try {
      updates.push(ok(bridge_aa, BigNumber.from(govIface.decodeFunctionResult("balances", result.returnData)[0]).toString()));
    } catch (e) {
      console.log(`governance: failed to decode balances() for ${bridge_aa}`, e);
      updates.push(failed(bridge_aa, `could not decode balances() on ${network}`));
    }
  });

  return { governanceAddresses, updates };
}

// Never throws: a failure becomes a `failed` update.
export const getObyteGovernanceLockedBalance = async ({ bridge_aa, governance_aa }, wallet) => {
  try {
    if (!governance_aa) {
      const vars = await withTimeout(
        obyte.api.getAaStateVars({ address: bridge_aa, var_prefix: "governance_aa" }),
        OBYTE_TIMEOUT,
        `governance_aa of ${bridge_aa}`
      );
      governance_aa = vars?.governance_aa;
      if (!governance_aa) throw new Error(`no governance AA for ${bridge_aa}`);
    }

    const key = `balance_${wallet}`;
    const vars = await withTimeout(
      obyte.api.getAaStateVars({ address: governance_aa, var_prefix: key }),
      OBYTE_TIMEOUT,
      `balance on ${governance_aa}`
    );
    const balance = vars?.[key];

    return ok(bridge_aa, balance === undefined || balance === null ? "0" : String(balance), { governance_aa });
  } catch (e) {
    console.log(`governance: failed to read the balance on the governance AA of ${bridge_aa}`, e);
    return { ...failed(bridge_aa, e.message), governance_aa };
  }
}
