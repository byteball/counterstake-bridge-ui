import { createAsyncThunk } from "@reduxjs/toolkit";
import { ethers } from "ethers";

import { getFactoryContractAddressByNetwork } from "pages/Create/utils/createBridgeOnEVM";
import { counterstakeFactoryAbi } from "abi";
import { providers } from "services/evm";
import obyte from "services/socket";
import { updateAssistantOrderStatus, updateBridgeOrder } from "store/settingsSlice";
import { getSymbol } from "utils";

export const checkCreatedOrders = createAsyncThunk(
  'checkCreatedOrders',
  async (_, { getState, dispatch }) => {
    const state = getState();

    if (state?.settings?.creationOrders?.assistant) {
      const order = state?.settings?.creationOrders?.assistant;
      const { network, status, txid } = order;

      if (status === "sent" && txid) {
        if (network === "Obyte") {
          const responses = await obyte.api.getAaResponseChain({ trigger_unit: txid });
          const address = responses.find((res) => (res?.response?.responseVars) && ("address" in res.response.responseVars))?.response.responseVars.address || null;
          const shares_asset = responses.find((res) => (res?.response?.responseVars) && ("shares_asset" in res.response.responseVars))?.response.responseVars.shares_asset || null;

          if (address && shares_asset) {
            dispatch(updateAssistantOrderStatus({ status: "created", address, shares_asset }))
          }

        } else {
          const provider = providers[network];
          try {
            const transaction = await provider.getTransactionReceipt(txid);
            if (transaction) {
              dispatch(updateAssistantOrderStatus({ status: "created" }))
            }
          } catch {
            console.error("assistant order check error")
          }
        }
      }
    }

    if (state?.settings?.creationOrders?.bridge) {
      const order = state?.settings?.creationOrders?.bridge;

      if (order.status === "configured") {
        if (order.foreign_bridge_request && order.foreign_network === "Obyte" && !order.foreign_address && !order.foreign_asset) {
          const responses = await obyte.api.getAaResponseChain({ trigger_unit: order.foreign_bridge_request });
          const address = responses.find((res) => (res?.response?.responseVars) && ("address" in res.response.responseVars))?.response.responseVars.address || null;
          const asset = responses.find((res) => (res?.response?.responseVars) && ("asset" in res.response.responseVars))?.response.responseVars.asset || null;

          if (address && asset) {
            dispatch(updateBridgeOrder({
              foreign_address: address,
              foreign_asset: asset
            }))
          }
        }

        if (order.foreign_address && order.foreign_asset && order.home_network === "Obyte") {
          const responses = await obyte.api.getAaResponseChain({ trigger_unit: order.home_bridge_request });
          const address = responses.find((res) => (res?.response?.responseVars) && ("address" in res.response.responseVars))?.response.responseVars.address || null;
          if (address) {
            dispatch(updateBridgeOrder({
              home_address: address,
              status: "created"
            }))
          }
        }

        if (order.foreign_bridge_request && order.foreign_network !== "Obyte" && !order.foreign_address && !order.foreign_asset) {

          try {
            const provider = providers[order.foreign_network];
            const factory_contract = getFactoryContractAddressByNetwork(order.foreign_network);
            const factory = new ethers.Contract(factory_contract, counterstakeFactoryAbi, provider);

            const eventFilter = factory.filters.NewImport();
            const event = await (await factory.queryFilter(eventFilter)).find((ev) => ev.transactionHash === order.foreign_bridge_request);

            const contractAddress = event.args.contractAddress;

            if (contractAddress) {
              dispatch(updateBridgeOrder({
                foreign_address: contractAddress,
                foreign_asset: contractAddress
              }))
            }

          } catch (e) {
            console.error("assistant order check error", e)
          }
        }

        if (order.home_bridge_request && order.foreign_address && order.foreign_asset && order.home_network !== "Obyte") {
          // EVM create export
          const provider = providers[order.home_network];

          const factory_contract = getFactoryContractAddressByNetwork(order.home_network);
          const factory = new ethers.Contract(factory_contract, counterstakeFactoryAbi, provider);

          const eventFilter = factory.filters.NewExport();
          const event = await (await factory.queryFilter(eventFilter)).find((ev) => ev.transactionHash === order.home_bridge_request);

          const contractAddress = event.args.contractAddress;

          try {
            if (contractAddress) {
              dispatch(updateBridgeOrder({
                home_address: contractAddress,
                status: "created"
              }));
            }
          } catch {
            console.error("assistant order check error")
          }
        }
      } else if (order.status === "created" && order.foreign_network === "Obyte") {
        const symbol = await getSymbol(order.foreign_asset);

        if (order.foreign_asset !== symbol && symbol && symbol.length <= 40) {
          dispatch(updateBridgeOrder({
            status: "symbol_created"
          }));
        }
      }

      if (order.home_assistant_request && !order.home_assistant_address) {
        if (order.home_network === "Obyte") {
          const responses = await obyte.api.getAaResponseChain({ trigger_unit: order.home_assistant_request });

          const address = responses.find((res) => (res?.response?.responseVars) && ("address" in res.response.responseVars))?.response.responseVars.address || null;
          const shares_asset = responses.find((res) => (res?.response?.responseVars) && ("shares_asset" in res.response.responseVars))?.response.responseVars.shares_asset || null;

          if (address && shares_asset) {
            dispatch(updateBridgeOrder({
              home_assistant_address: address,
              home_assistant_shares_asset: shares_asset
            }));
          }
        } else {
          const provider = providers[order.home_network];

          try {
            const transaction = await provider.getTransactionReceipt(order.home_assistant_request);

            if (transaction) {
              dispatch(updateBridgeOrder({
                home_assistant_address: true,
                home_assistant_shares_asset: true
              }));
            }

          } catch (e) {
            console.error("assistant order check error", e)
          }
        }
      }


      if (order.foreign_assistant_request && !order.foreign_assistant_address) {
        if (order.foreign_network === "Obyte") {
          const responses = await obyte.api.getAaResponseChain({ trigger_unit: order.foreign_assistant_request });

          const address = responses.find((res) => (res?.response?.responseVars) && ("address" in res.response.responseVars))?.response.responseVars.address || null;
          const shares_asset = responses.find((res) => (res?.response?.responseVars) && ("shares_asset" in res.response.responseVars))?.response.responseVars.shares_asset || null;

          if (address && shares_asset) {
            dispatch(updateBridgeOrder({
              foreign_assistant_address: address,
              foreign_assistant_shares_asset: shares_asset
            }));
          }
        } else {
          const provider = providers[order.home_network];

          try {
            const transaction = await provider.getTransactionReceipt(order.foreign_assistant_request);

            if (transaction) {
              dispatch(updateBridgeOrder({
                foreign_assistant_address: true,
                foreign_assistant_shares_asset: true
              }));
            }

          } catch (e) {
            console.error("assistant order check error", e)
          }
        }
      }
    }
  })