import {
  calculatePoolTokensForDeposit,
  calculatePoolTokensForWithdraw,
} from "./index";

describe("sanity tests for ensuring wasm works", () => {
  test("calculatePoolTokensForDeposit", async () => {
    const runner = calculatePoolTokensForDeposit({} as any); // TODO create testing helpers
    expect(await runner(100n, 100_000_000n, 100_000_000_000n)).toBe(100000n);
  });

  test("calculatePoolTokensForWithdraw", async () => {
    const runner = calculatePoolTokensForWithdraw({} as any); // TODO create testing helpers
    expect(await runner(1_000n, 100_000_000n, 100_000_000n)).toBe(1000n);
  });
});
