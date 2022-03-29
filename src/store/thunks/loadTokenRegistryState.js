import { createAsyncThunk } from "@reduxjs/toolkit";
import client from "services/socket";
import config from "appConfig";

export const loadTokenRegistryState = createAsyncThunk(
  'loadTokenRegistryState',
  async () => {
    const s2a = await client.api.getAaStateVars({ address: config.TOKEN_REGISTRY, var_prefix: "s2a_" });
    const decimals = await client.api.getAaStateVars({ address: config.TOKEN_REGISTRY, var_prefix: "decimals_" });
    const current_desc = await client.api.getAaStateVars({ address: config.TOKEN_REGISTRY, var_prefix: "current_desc_" });
    return { ...s2a, ...decimals, ...current_desc }
  })