export const normalizeAddress = (address: string) => {
  return address ? address.slice(0, 6) + "..." + address.slice(-4) : "";
};

export const normalizeBalance = (balance: number) => {
  return balance
    ? balance.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })
    : "--";
};
