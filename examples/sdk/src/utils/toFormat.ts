export function toFormat(amount: bigint, decimals: number = 6) {
  return Number(amount) / 10 ** decimals;
}
