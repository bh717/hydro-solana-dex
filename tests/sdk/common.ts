import * as anchor from "@project-serum/anchor";
import { AccountInfo, Keypair } from "@solana/web3.js";
import assert from "assert";
import { HydraSDK } from "hydra-ts";
import {
  AccountPubkey,
  getAccountLoader,
} from "hydra-ts/src/types/account-loader";
import * as TokenAccount from "hydra-ts/src/types/TokenAccount";
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

    const { data } = await sdk.common.getTokenAccountInfo(vault.publicKey);

    assert.strictEqual(data.amount, 100000000n);
    assert.strictEqual(`${data.mint}`, `${mint.publicKey}`);
    assert.strictEqual(`${data.owner}`, `${provider.wallet.publicKey}`);
  });

  describe("accountLoader.stream()", () => {
    async function setup() {
      const mint = Keypair.generate();
      const vault = Keypair.generate();
      const owner = sdk.ctx.wallet.publicKey;
      await sdk.common.createMintAndVault(mint, vault, 100_000_000n);

      const token = await sdk.common.createTokenAccount(mint.publicKey, owner);

      const account = getAccountLoader(sdk.ctx, token, TokenAccount.Parser);
      return { account, mint, token, owner, vault };
    }

    it("should emit a value on subscription", async () => {
      const { account, mint, owner } = await setup();
      const [val] = await new Promise<
        AccountPubkey<TokenAccount.TokenAccount>[]
      >((resolve) => {
        account.stream().pipe(take(1), toArray()).subscribe(resolve);
      });
      assert.strictEqual(`${val.pubkey}`, `${await account.key()}`);
      assert.strictEqual(`${val.account.data.amount}`, `0`);
      assert.strictEqual(`${val.account.data.mint}`, `${mint.publicKey}`);
      assert.strictEqual(`${val.account.data.owner}`, `${owner}`);
    });

    it("should emit a value when updated", async () => {
      const { account, vault, token } = await setup();

      const [val1, val2] = await new Promise<
        AccountPubkey<TokenAccount.TokenAccount>[]
      >((resolve) => {
        account.stream().pipe(take(2), toArray()).subscribe(resolve);

        sdk.common.transfer(vault.publicKey, token, 1000);
      });

      assert.strictEqual(`${val1.account.data.amount}`, `0`);
      assert.strictEqual(`${val2.account.data.amount}`, `1000`);
    });
  });
});
