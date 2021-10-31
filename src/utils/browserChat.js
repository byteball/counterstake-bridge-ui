import client from "services/socket";
import browserChat from "obyte-browser-chat";

const environment = process.env.REACT_APP_ENVIRONMENT;

export default new browserChat({ client, name: "Counterstake.org", testnet: environment === "testnet" });