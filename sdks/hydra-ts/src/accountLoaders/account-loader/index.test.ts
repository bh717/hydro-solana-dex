import { Ctx } from "../..";
import { AccountLoader } from "./account-loader";
import { Keypair, PublicKey } from "@solana/web3.js";
import { IAccountLoader } from "./types";
import { merge } from "lodash";
import { sleep } from "@project-serum/common";
import { buffer, take, toArray } from "rxjs";
import { AccountData } from ".";

function getMockCtx(override?: any) {
  const base = {
    connection: {
      getAccountInfo() {
        return {};
      },
    },
  };
  return merge(base, override) as any as Ctx;
}

function fakeEventHandler(options?: { buffer: boolean }) {
  const isBuffer = options?.buffer;
  const buffer: any[] = [];
  type Callback = (info: any) => void;
  let _callback: Callback = (event) => {
    if (!isBuffer) {
      throw new Error("emit called before listener");
    }

    if (isBuffer) {
      buffer.push(event);
    }
  };
  function onChange(key: any, callback: (event: any) => void, commitment: any) {
    _callback = callback;
    if (buffer.length) {
      buffer.forEach(_callback);
    }
  }

  function emit(event: any) {
    _callback(event);
  }
  return [onChange, emit] as [typeof onChange, typeof emit];
}

describe("AccountLoader", () => {
  let mockCtx: Ctx;
  let pubKey: PublicKey;
  let loader: IAccountLoader<any>;

  beforeEach(() => {
    mockCtx = getMockCtx();

    pubKey = Keypair.generate().publicKey;
  });

  it("should have the correct key", async () => {
    loader = AccountLoader(mockCtx, pubKey, () => {});
    expect(await loader.key()).toBe(pubKey);
  });

  it("should have the correct info", async () => {
    loader = AccountLoader(mockCtx, pubKey, () => "hello");
    expect(await loader.info()).toEqual({ data: "hello" });
    expect(await loader.isInitialized()).toBe(true);
  });

  it("should be uninitialized if the info returned is null", async () => {
    loader = AccountLoader(
      getMockCtx({
        connection: {
          getAccountInfo() {
            return null;
          },
        },
      }),
      pubKey,
      () => {}
    );
    expect(await loader.isInitialized()).toBe(false);
  });

  it("should listen to change events", async () => {
    const [onChange, emit] = fakeEventHandler();

    loader = AccountLoader(
      getMockCtx({
        connection: {
          onAccountChange: onChange,
        },
      }),
      pubKey,
      (a) => a
    );
    const events: any[] = [];
    loader.onChange((info) => {
      events.push(info);
    }, "finalized");
    await loader.ready(); // need to wait until we have the key before can listen to events
    emit(1);
    emit(2);
    expect(events).toEqual([1, 2]);
  });

  describe("loader.changes()", () => {
    let emit: any;
    let onChange: any;
    beforeEach(() => {
      [onChange, emit] = fakeEventHandler({ buffer: true });

      loader = AccountLoader(
        getMockCtx({
          connection: {
            getAccountInfo() {
              return 1; // first
            },
            onAccountChange: onChange,
          },
        }),
        pubKey,
        (a) => a
      );
    });

    it("should return the info as the first event", async () => {
      const stream = loader.changes();
      const events = await new Promise((resolve) =>
        stream.pipe(take(1), toArray()).subscribe(resolve)
      );
      expect(events).toEqual([{ account: { data: 1 }, pubkey: pubKey }]);
    });

    it("should stream other events", async () => {
      const stream = loader.changes();

      // stream starts with account info
      emit(2);
      emit(3);
      emit(4);

      const events = await new Promise((resolve) =>
        stream.pipe(take(4), toArray()).subscribe(resolve)
      );

      expect(events).toEqual([
        { account: { data: 1 }, pubkey: pubKey },
        { account: { data: 2 }, pubkey: pubKey },
        { account: { data: 3 }, pubkey: pubKey },
        { account: { data: 4 }, pubkey: pubKey },
      ]);
    });
  });
});
