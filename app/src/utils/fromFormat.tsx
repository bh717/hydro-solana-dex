export function fromFormat(amount: number, decimals: number = 6) {
  // console.log("fromFormat", { amount, decimals });
  return BigInt(parseInt((amount * 10 ** decimals).toString()));
}
