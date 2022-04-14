export function fromFormat(amount: number, decimals: number = 6) {
  return BigInt(parseInt((amount * 10 ** decimals).toString()));
}
