import obyte from "../services/socket";

export const getAaBalances = (address) => {
  return new Promise(function (resolve, reject) {
    obyte.client.request('light/get_aa_balances', { address }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res?.balances);
      }
    });
  })
}