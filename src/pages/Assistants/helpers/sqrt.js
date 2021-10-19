import { FixedNumber } from "ethers";

const ONE = FixedNumber.from("1");
const TWO = FixedNumber.from("2");

export const sqrt = (value) => {
  const x = FixedNumber.from(value);
  let z = x.addUnsafe(ONE).divUnsafe(TWO);
  let y = x;
  while (z.subUnsafe(y).isNegative()) {
    y = z;
    z = x.divUnsafe(z).addUnsafe(z).divUnsafe(TWO);
  }
  return y;
}