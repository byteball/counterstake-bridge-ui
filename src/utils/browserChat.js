import client from "services/socket";
import browserChat from "obyte-browser-chat";
import config from "appConfig";

const environment = config.ENVIRONMENT;

export default new browserChat({ client, name: "Counterstake.org", testnet: environment === "testnet" });