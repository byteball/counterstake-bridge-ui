import { createAsyncThunk } from "@reduxjs/toolkit";
import { formatUnits } from "ethers/lib/utils";
import { uniq, uniqBy } from "lodash";

import { getTransfersByDestAddress } from "services/api";
import { startWatchingDestinationBridge, startWatchingSourceBridge } from "services/watch";
import { setTransfers } from "store/transfersSlice";

export const loadMissedTransfers = createAsyncThunk(
	'get/loadMissedTransfers',
	async (_directions, { getState, dispatch }) => {
		const missedTransfers = [];

		const state = getState();
		const transfers = state.transfers;
		const directions = _directions || state.directions;
		const addresses = uniq(Object.values(state.destAddress).filter((v) => v));

		let transfersHistory = [];

		for (let index in addresses) {
			const transfersHistoryByAddress = await getTransfersByDestAddress(addresses[index]);
			transfersHistory = [...transfersHistory, ...transfersHistoryByAddress];
		}

		const uniqTransfers = uniqBy(transfersHistory, (item) => item.txid);

		for (let index in uniqTransfers) {
			const transfer = uniqTransfers[index];

			if (!transfers.find(item => item.txid === transfer.txid)) {
				const direction = Object.values(directions).find((item) => (item?.bridge_id === transfer?.bridge_id) && transfer?.type === item?.type);

				if (direction) {
					if (direction.src_token.network === 'Obyte') {
						await startWatchingSourceBridge(direction.src_token.network, direction.src_bridge_aa);
					}

					await startWatchingDestinationBridge(direction.dst_token.network, direction.dst_bridge_aa);

					missedTransfers.push({
						...direction,
						...transfer,
						amount: +formatUnits(transfer.amount, direction.src_token.decimals),
						claim_txid: transfer.claim_txid,
						dest_address: transfer.dest_address,
						dst_bridge_aa: direction.dst_bridge_aa,
						dst_token: direction.dst_token,
						is_finished: transfer.is_finished,
						reward: +formatUnits(transfer.reward, direction.src_token.decimals),
						sender_address: transfer.sender_address,
						src_token: direction.src_token,
						status: transfer.status,
						ts: transfer.txts * 1000,
						txid: transfer.txid,
						txts: transfer.txts,
					});
				} else {
					console.error('direction not found', transfer); // for testnet it's rinkeby directions
				}
			}
		}
		
		dispatch(setTransfers([...transfers, ...missedTransfers]))
	}
);
