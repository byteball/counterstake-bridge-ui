import obyte from "../services/socket";

export const executeGetter = (address, getter, args) => {
  return new Promise(function (resolve, reject) {
    obyte.client.request('light/execute_getter', { address, getter, args }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res?.result);
      }
    });
  })
}