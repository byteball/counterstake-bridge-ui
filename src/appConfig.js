export default {
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  GA_ID: process.env.REACT_APP_GA_ID,
  INFURA_PROJECT_ID: process.env.REACT_APP_INFURA_PROJECT_ID,
  OBYTE_IMPORT_BASE_AAS: process.env.REACT_APP_OBYTE_IMPORT_BASE_AAS.split(","),
  OBYTE_EXPORT_BASE_AAS: process.env.REACT_APP_OBYTE_EXPORT_BASE_AAS.split(","),
  IMPORT_FORWARD_FACTORY: process.env.REACT_APP_IMPORT_FORWARD_FACTORY,
  ICON_CDN_URL: process.env.REACT_APP_ICON_CDN_URL,
  TOKEN_REGISTRY: process.env.REACT_APP_TOKEN_REGISTRY,
  OBYTE_EXPORT_FACTORY: process.env.REACT_APP_OBYTE_EXPORT_FACTORY,
  OBYTE_IMPORT_FACTORY: process.env.REACT_APP_OBYTE_IMPORT_FACTORY,
  OBYTE_ASSISTANT_EXPORT_FACTORY: process.env.REACT_APP_OBYTE_ASSISTANT_EXPORT_FACTORY,
  OBYTE_ASSISTANT_IMPORT_FACTORY: process.env.REACT_APP_OBYTE_ASSISTANT_IMPORT_FACTORY,
  ETHEREUM_ASSISTANT_FACTORY: process.env.REACT_APP_ETHEREUM_ASSISTANT_FACTORY,
  BSC_ASSISTANT_FACTORY: process.env.REACT_APP_BSC_ASSISTANT_FACTORY,
  POLYGON_ASSISTANT_FACTORY: process.env.REACT_APP_POLYGON_ASSISTANT_FACTORY,
  ETHEREUM_BRIDGE_FACTORY: process.env.REACT_APP_ETHEREUM_BRIDGE_FACTORY,
  BSC_BRIDGE_FACTORY: process.env.REACT_APP_BSC_BRIDGE_FACTORY,
  POLYGON_BRIDGE_FACTORY: process.env.REACT_APP_POLYGON_BRIDGE_FACTORY
}