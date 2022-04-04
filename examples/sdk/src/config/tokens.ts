import tokenMap from "config-ts/tokens/localnet.json";
import { PublicKey } from "@solana/web3.js";

export const [btcToken] = tokenMap.tokens.filter(
  (t) => t.symbol.toLowerCase() === "btc"
);
export const [usdcToken] = tokenMap.tokens.filter(
  (t) => t.symbol.toLowerCase() === "usdc"
);
export const usdMint = new PublicKey(usdcToken.address);
export const btcMint = new PublicKey(btcToken.address);
