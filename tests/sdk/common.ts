import * as anchor from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import assert from "assert";
import { HydraSDK, TokenAccount, AccountLoader } from "hydra-ts";
import { take, toArray } from "rxjs/operators";

describe("HydraSDK", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  let sdk: HydraSDK;
  beforeEach(() => {
    sdk = HydraSDK.createFromAnchorProvider(provider, "localnet");
  });

  it("should get accounts", async () => {
    const mint = Keypair.generate();
    const vault = Keypair.generate();

    await sdk.common.createMintAndVault(mint, vault, 100_000_000n);
    const result = await sdk.user.getTokenAccounts();
    assert(result.length > 0);

    const results = await sdk.user.getTokenAccounts(mint.publicKey);
    const [resultMint] = results;

    assert.strictEqual(results.length, 1);
    assert.strictEqual(resultMint.toString(), vault.publicKey.toString());
  });

  it("should get the mint from accounts", async () => {
    const mint = Keypair.generate();
    const vault = Keypair.generate();

    await sdk.common.createMintAndVault(mint, vault, 100_000_000n);

    const loader = AccountLoader.Token(sdk.ctx, vault.publicKey);
    const { data } = await loader.info();

    assert.strictEqual(data.amount, 100000000n);
    assert.strictEqual(`${data.mint}`, `${mint.publicKey}`);
    assert.strictEqual(`${data.owner}`, `${provider.wallet.publicKey}`);
  });

  describe("accountLoader.changes()", () => {
    async function setup() {
      const mint = Keypair.generate();
      const vault = Keypair.generate();
      const owner = sdk.ctx.wallet.publicKey;
      await sdk.common.createMintAndVault(mint, vault, 100_000_000n);

      const token = await sdk.common.createTokenAccount(mint.publicKey, owner);
      const account = AccountLoader.Token(sdk.ctx, token);

      // const account = getAccountLoader(sdk.ctx, token, TokenAccount.Parser);
      return { account, mint, token, owner, vault };
    }

    it("should emit a value on subscription", async () => {
      const { account, mint, owner } = await setup();
      const [val] = await new Promise<
        (AccountLoader.AccountData<TokenAccount> | undefined)[]
      >((resolve) => {
        account.changes().pipe(take(1), toArray()).subscribe(resolve);
      });
      assert.strictEqual(`${val?.pubkey}`, `${await account.key()}`);
      assert.strictEqual(`${val?.account.data.amount}`, `0`);
      assert.strictEqual(`${val?.account.data.mint}`, `${mint.publicKey}`);
      assert.strictEqual(`${val?.account.data.owner}`, `${owner}`);
    });

    it("should emit a value when updated", async () => {
      const { account, vault, token } = await setup();

      const [val1, val2] = await new Promise<
        (AccountLoader.AccountData<TokenAccount> | undefined)[]
      >((resolve) => {
        account.changes().pipe(take(2), toArray()).subscribe(resolve);

        sdk.common.transfer(vault.publicKey, token, 1000);
      });

      assert.strictEqual(`${val1?.account.data.amount}`, `0`);
      assert.strictEqual(`${val2?.account.data.amount}`, `1000`);
    });
  });

  describe("calculateSwap", () => {
    it("swapYToXHmm", async () => {
      type Test = {
        input: [
          bigint,
          number,
          bigint,
          number,
          number,
          bigint,
          number,
          bigint,
          bigint,
          bigint
        ];
        output: [bigint, bigint, bigint];
      };
      const tests: Test[] = [
        {
          input: [
            1000000000000000n,
            9,
            1000000000000n,
            6,
            0,
            0n,
            0,
            1n,
            500n,
            1000000n,
          ],
          output: [0n, 0n, 0n],
        },
      ];

      for (let { input, output } of tests) {
        await sdk.liquidityPools.swapYToXHmm(...input);
      }
    });
    it("swapXToYHmm", async () => {
      type Test = {
        name: string;
        input: [
          bigint,
          number,
          bigint,
          number,
          number,
          bigint,
          number,
          bigint,
          bigint,
          bigint
        ];
        dir: "xy" | "yx";
        output: [bigint, bigint, bigint, bigint, bigint];
      };
      const tests: Test[] = [
        {
          name: "forward",
          input: [
            1000000000000000n,
            9,
            1000000000000n,
            6,
            0,
            0n,
            0,
            1n,
            500n,
            1000000n,
          ],
          output: [
            1000000001000000n, // x_new
            999999999002n, // y_new
            998000n, // delta_x
            998n, // delta_y
            2000n, // fees
          ],
          dir: "xy",
        },
        {
          name: "backward",
          input: [
            1000000000000000n,
            9,
            1000000000000n,
            6,
            0,
            0n,
            0,
            1n,
            500n,
            1000000000n,
          ],
          output: [
            999002995010980n, // x_new
            1001000000000n, // y_new
            997004989020n, // delta_x
            998000000n, // delta_y
            2000000n, // fees
          ],
          dir: "yx",
        },
      ];

      for (let { name, input, dir, output } of tests) {
        const ans =
          dir === "xy"
            ? await sdk.liquidityPools.swapXToYHmm(...input)
            : await sdk.liquidityPools.swapYToXHmm(...input);
        assert.deepStrictEqual(ans, output);
      }
    });
  });
});
