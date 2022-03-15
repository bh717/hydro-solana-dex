import { BN } from "@project-serum/anchor";

const btcdDecimals = 6;
const usddDecimals = 6;

export const btcdMintAmount = new BN(21_000_000 * 10 ** btcdDecimals);
export const usddMintAmount = new BN(100_000_000 * 10 ** usddDecimals);

export const BTCD_MINT_AMOUNT = 21_000_000n * 10n ** 6n;
export const USDD_MINT_AMOUNT = 100_000_000n * 10n ** 6n;
