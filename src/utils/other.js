const tokensEqual = (t1, t2) => t1.asset === t2.asset && t1.network === t2.network;

export const getOrInsertInput = (inputs, token) => {
  for (let input of inputs)
    if (tokensEqual(input.token, token))
      return input;
  const new_input = { token, destinations: [] };
  inputs.push(new_input);
  return new_input;
}