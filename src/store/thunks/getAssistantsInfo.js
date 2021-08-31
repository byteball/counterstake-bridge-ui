
import { createAsyncThunk } from "@reduxjs/toolkit";
import { BigNumber, ethers } from "ethers";
import { assistantFactories } from "pages/Assistants/assistantFactories";
import { providers } from "services/evm";
import obyte from "services/socket";

const environment = process.env.REACT_APP_ENVIRONMENT;

export const getAssistantsInfo = createAsyncThunk(
  'get/getAssistantsInfo',
  async (_, { getState }) => {
    // init values
    const store = getState();
    const factories = assistantFactories[environment];
    const networks = Object.keys(factories);

    // get Obyte Data
    const [importObyteAssistants, exportObyteAssistants] = await Promise.all([
      obyte.api.getAaStateVars({ address: factories.Obyte.import }),
      obyte.api.getAaStateVars({ address: factories.Obyte.export })
    ])

    // Get ETH DATA
    const provider = providers["Ethereum"];
    const ethFactoryContract = new ethers.Contract(factories["Ethereum"].import, [], provider);

    console.log("contract", ethFactoryContract)

    console.log("importObyteAssistants, exportObyteAssistants", importObyteAssistants, exportObyteAssistants)

    console.log("networks", networks)


  })