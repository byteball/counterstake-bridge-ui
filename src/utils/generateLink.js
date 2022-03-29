import { encodeData } from "./encodeData";
import config from "appConfig";

const suffixes = {
  mainnet: "",
  testnet: "-tn",
  devnet: "-dev",
};
const suffix = suffixes[config.ENVIRONMENT];

export const generateLink = ({ amount, data, from_address, aa, asset, is_single }) => {
  let link = `obyte${suffix}:${aa}?amount=${Math.round(amount)}&asset=${encodeURIComponent(asset || "base")}`;
  if (data)
    link += '&base64data=' + encodeURIComponent(encodeData(data));
  if (from_address)
    link += '&from_address=' + from_address;
  if (is_single)
    link += '&single_address=1';
  return link;
};
