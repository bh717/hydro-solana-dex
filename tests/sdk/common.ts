import * as anchor from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import assert from "assert";
import { HydraSDK, SPLAccountInfo } from "hydra-ts";
import { take, toArray } from "rxjs/operators";
// import { validatorReset } from "test-utils-ts";
type MintInfo = {
  supply: bigint;
  mintAuthority: anchor.web3.PublicKey | null;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: anchor.web3.PublicKey | null;
};
type StringSPLAccountInfo = { [K in keyof SPLAccountInfo]: string };
function stringInfo(info: SPLAccountInfo): StringSPLAccountInfo {
  return {
    address: `${info.address}`,
    owner: `${info.owner}`,
    amount: `${info.amount}`,
    mint: `${info.mint}`,
  };
}

type StringInfoObjectOut<T> = T extends Record<any, SPLAccountInfo>
  ? { [K in keyof T]: StringSPLAccountInfo }
  : never;
function stringInfoObject<T extends Record<any, SPLAccountInfo>>(
  obj: T
): StringInfoObjectOut<T> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, stringInfo(v)])
  ) as StringInfoObjectOut<T>;
}

function stringifyMintInfo(mintInfo: MintInfo): {
  [K in keyof MintInfo]: string;
} {
  return {
    supply: `${mintInfo.supply}`,
    mintAuthority: `${mintInfo.mintAuthority}`,
    decimals: `${mintInfo.decimals}`,
    isInitialized: `${mintInfo.isInitialized}`,
    freezeAuthority: `${mintInfo.freezeAuthority}`,
  };
}

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
    const result = await sdk.common.getTokenAccounts();
    assert(result.length > 0);

    const results = await sdk.common.getTokenAccounts(mint.publicKey);
    const [resultMint] = results;

    assert.strictEqual(results.length, 1);
    assert.strictEqual(resultMint.toString(), vault.publicKey.toString());
  });

  it("should get the mint from accounts", async () => {
    const mint = Keypair.generate();
    const vault = Keypair.generate();

    await sdk.common.createMintAndVault(mint, vault, 100_000_000n);

    const info = await sdk.common.getTokenAccountInfo(vault.publicKey);
    assert.strictEqual(`${info.address}`, `${vault.publicKey}`);
    assert.strictEqual(info.amount, 100000000n);
    assert.strictEqual(`${info.mint}`, `${mint.publicKey}`);
    assert.strictEqual(`${info.owner}`, `${provider.wallet.publicKey}`);
  });
  describe("getTokenAccountInfoStream()", () => {
    it("should emit a value on subscription", async () => {
      const mint = Keypair.generate();
      const vault = Keypair.generate();
      const owner = sdk.ctx.wallet.publicKey;
      await sdk.common.createMintAndVault(mint, vault, 100_000_000n);
      const token = await sdk.common.createTokenAccount(mint.publicKey, owner);
      const [val] = await new Promise<SPLAccountInfo[]>((resolve) => {
        sdk.common
          .getTokenAccountInfoStream(token)
          .pipe(take(1), toArray())
          .subscribe(resolve);
      });

      assert.strictEqual(`${val.address}`, `${token}`);
      assert.strictEqual(`${val.amount}`, `0`);
      assert.strictEqual(`${val.mint}`, `${mint.publicKey}`);
      assert.strictEqual(`${val.owner}`, `${owner}`);
    });

    it("should emit a value when updated", async () => {
      const mint = Keypair.generate();
      const vault = Keypair.generate();
      const owner = sdk.ctx.wallet.publicKey;
      await sdk.common.createMintAndVault(mint, vault, 100_000_000n);
      const token = await sdk.common.createTokenAccount(mint.publicKey, owner);
      const [val1, val2] = await new Promise<SPLAccountInfo[]>((resolve) => {
        sdk.common
          .getTokenAccountInfoStream(token)
          .pipe(take(2), toArray())
          .subscribe(resolve);

        sdk.common.transfer(vault.publicKey, token, 1000);
      });

      assert.deepEqual(stringInfo(val1), {
        address: `${token}`,
        amount: "0",
        mint: `${mint.publicKey}`,
        owner: `${owner}`,
      });

      assert.deepEqual(stringInfo(val2), {
        address: `${token}`,
        amount: "1000",
        mint: `${mint.publicKey}`,
        owner: `${owner}`,
      });
    });
  });

  describe("getMint()", () => {
    it("should get a mint token", async () => {
      const mint = Keypair.generate();
      const vault = Keypair.generate();
      await sdk.common.createMintAndVault(mint, vault, 100_000_000n);
      const mintInfo = await sdk.common.getMint(mint.publicKey);

      assert.deepEqual(stringifyMintInfo(mintInfo), {
        mintAuthority: sdk.ctx.provider.wallet.publicKey.toString(),
        supply: "100000000",
        decimals: "9",
        isInitialized: "true",
        freezeAuthority: "null",
      });
    });
  });

  describe("getTokenAccountInfoStreams()", () => {
    it("should combine the values of the streams", async () => {
      const mint = Keypair.generate();
      const vault = Keypair.generate();
      const owner = sdk.ctx.wallet.publicKey;
      await sdk.common.createMintAndVault(mint, vault, 100_000_000n);
      const token = await sdk.common.createTokenAccount(mint.publicKey, owner);

      // So because transfer deducts from one account then increases from the other account there are 3 combined states
      const states = await new Promise<
        {
          vault: SPLAccountInfo;
          token: SPLAccountInfo;
        }[]
      >((resolve) => {
        sdk.common
          .getTokenAccountInfoStreams({
            vault: vault.publicKey,
            token,
          })
          .pipe(take(3), toArray())
          .subscribe((thing) => {
            resolve(thing);
          });

        sdk.common.transfer(vault.publicKey, token, 1000);
      });

      const first = states.at(0)!;
      const last = states.at(-1)!;

      assert.deepEqual(stringInfoObject(first), {
        vault: {
          address: `${vault.publicKey}`,
          owner: `${owner}`,
          amount: "100000000",
          mint: `${mint.publicKey}`,
        },
        token: {
          address: `${token}`,
          owner: `${owner}`,
          amount: "0",
          mint: `${mint.publicKey}`,
        },
      });

      assert.deepEqual(stringInfoObject(last), {
        vault: {
          address: `${vault.publicKey}`,
          owner: `${owner}`,
          amount: "99999000",
          mint: `${mint.publicKey}`,
        },
        token: {
          address: `${token}`,
          owner: `${owner}`,
          amount: "1000",
          mint: `${mint.publicKey}`,
        },
      });
    });
  });
});
