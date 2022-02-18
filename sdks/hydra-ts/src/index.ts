import * as wasm from "hydra-math-rs";
import { loadWasm } from "./utils/wasm-loader";

const hydraMath = loadWasm(wasm);

export async function add(a: number, b: number) {
  return await hydraMath.add(BigInt(a), BigInt(b));
}
