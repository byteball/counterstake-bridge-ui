import { encodeData } from "./encodeData";
import config from "appConfig";

const suffixes = {
  mainnet: "",
  testnet: "-tn",
  devnet: "-dev",
};
const suffix = suffixes[config.ENVIRONMENT];

export const generateLink = ({ amount, amount2, data, from_address, aa, asset, asset2, is_single }) => {
  let link = `obyte${suffix}:${aa}?amount=${Math.round(amount)}&asset=${encodeURIComponent(asset || "base")}`;
  if (data)
    link += '&base64data=' + encodeURIComponent(encodeData(data));
  if (from_address)
    link += '&from_address=' + from_address;
  if (asset2)
    link += '&asset2=' + encodeURIComponent(asset2);
  if (amount2)
    link += '&amount2=' + amount2;
  if (is_single)
    link += '&single_address=1';
  return link;
};
