import obyte from "../services/socket";

export const getRequiredStakeObyte = async (dst_bridge_aa, amount) => {
  return new Promise(function (resolve, reject) {
    obyte.client.request('light/execute_getter', { address: dst_bridge_aa, getter: 'get_required_stake', args: [amount] }, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res?.result)
      }
    });
  })
}