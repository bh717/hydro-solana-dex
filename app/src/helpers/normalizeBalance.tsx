const normalizeBalance = (balance: number) => {
    return balance ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '--';
}

export default normalizeBalance