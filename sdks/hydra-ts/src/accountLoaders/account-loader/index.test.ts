import { Ctx } from "../..";
import { AccountLoader } from ".";
import { Keypair, PublicKey } from "@solana/web3.js";
import { IAccountLoader } from "./types";
import { take, toArray } from "rxjs";
import { fakeEventHandler } from "../../utils/fakeEventHandler";
import { getMockCtx } from "../../utils/getMockCtx";

async function waitForEvents<T>(loader: IAccountLoader<T>, count: number) {
  await new Promise((resolve) =>
    loader.stream().pipe(take(count), toArray()).subscribe(resolve)
  );
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
    loader = AccountLoader(
      getMockCtx({
        connection: {
          getAccountInfo() {
            return 0;
          },
        },
      }),
      pubKey,
      () => "hello"
    );
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
    const [onChange, emit] = fakeEventHandler({ buffer: true });

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

    emit(1);
    emit(2);

    await waitForEvents(loader, 2);
    expect(events).toEqual([1, 2]);
  });

  describe("loader.stream()", () => {
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
      const stream = loader.stream();
      const events = await new Promise((resolve) =>
        stream.pipe(take(1), toArray()).subscribe(resolve)
      );
      expect(events).toEqual([{ account: { data: 1 }, pubkey: pubKey }]);
    });

    it("should stream other events", async () => {
      const stream = loader.stream();

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
