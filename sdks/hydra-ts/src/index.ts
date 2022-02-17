import * as wasm from "hydra-math-sdk";

export async function add(a: number, b: number) {
  if (typeof wasm.default !== "object") await wasm.default();
  return wasm.add(BigInt(a), BigInt(b));
}
