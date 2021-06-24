import ReactGA from "react-ga";

export const sendTransferToGA = (src_token, dst_token) => {
  ReactGA.event({
    category: "Transfer",
    action: "Transfer",
    label: src_token.symbol + ' ' + src_token.network + ' to ' + dst_token.network
  });
};

