import { calculatePoolTokensForDeposit } from "./index";

test("Hello Wasm!", async () => {
  const runner = calculatePoolTokensForDeposit();
  expect(
    await runner(BigInt(100), BigInt(100_000_000), BigInt(100_000_000_000))
  ).toBe(100000n);
});
