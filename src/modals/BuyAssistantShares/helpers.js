export const get_shares = ({ side, stake_balance = 0, exponent = 1, image_balance = 0, stake_share = 0.5 }) => {
  if (side === "export") {
    return stake_balance ** (1 / exponent)
  } else {
    return stake_balance ** (stake_share / exponent) * image_balance ** ((1 - (stake_share)) / exponent);
  }
}

export const generatePaymentMessage = (objPaymentRequest) => {
  const paymentJson = JSON.stringify(objPaymentRequest);
  return Buffer.from(paymentJson).toString('base64');
}