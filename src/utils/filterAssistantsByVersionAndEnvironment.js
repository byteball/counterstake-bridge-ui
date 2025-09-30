import appConfig from "appConfig";

export const filterAssistantsByVersionAndEnvironment = (assistantsList) => {
  return assistantsList.filter(({ network, version }) =>
    (network === "Obyte" || version !== "v1") &&
    (appConfig.ENVIRONMENT !== 'testnet' || network !== "Ethereum")
  );
};