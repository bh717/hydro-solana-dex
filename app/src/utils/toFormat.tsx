export function toFormat(amount: bigint, decimals: number = 6) {
  // console.log("toFormat", { amount, decimals });
  return Number(amount) / 10 ** decimals;
}
