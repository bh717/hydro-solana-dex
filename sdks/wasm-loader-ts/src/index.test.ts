import * as wasm from "wasm-test";
import { loadWasm } from ".";
import { WasmLoaderReturn } from "./types";
import { expectError } from "./utils/testing";

describe("wasm-loader", () => {
  let testWasm: WasmLoaderReturn<typeof wasm>;
  beforeEach(() => {
    testWasm = loadWasm(wasm);
  });

  test("add", async () => {
    expect(await testWasm.add(100n, 200n)).toBe(300n);
  });
  test("div", async () => {
    expect(await testWasm.div(400n, 4n)).toBe(100n);
  });

  test("panic", async () => {
    const { message } = await expectError(async () => {
      await testWasm.yikes();
    });
    expect(message).toBe(
      "Error: An unknown error was thrown while executing the 'yikes()' handler in your wasm module."
    );
  });

  test("div by zero", async () => {
    const { message } = await expectError(async () => {
      await testWasm.div(400n, 0n);
    });
    expect(message).toBe("Error: Divide by zero");
  });

  test("when no error", async () => {
    const result = await testWasm.check_string_err(1n);

    expect(result).toBe(1n);
  });

  test("when returning an error", async () => {
    const { message } = await expectError(async () => {
      await testWasm.check_string_err(11n);
    });
    expect(message).toBe("Error: Answer is greater than 10!");
  });

  test("when returning an option", async () => {
    const undef = await testWasm.only_even(1111n);
    const even = await testWasm.only_even(2222n);

    expect(undef).toBeUndefined();
    expect(even).toBe(2222n);
  });

  test("returning_struct", async () => {
    const obj = await testWasm.returning_struct(100n);
    expect(obj).toEqual({ x: 100n, y: 100n });
    const { message } = await expectError(async () => {
      await testWasm.returning_struct(11n);
    });
    expect(message).toBe("Error: You passed in an odd number!");
  });

  test("returning vec", async () => {
    const vec = await testWasm.returning_vec(100n);
    expect(vec).toEqual([1n, 2n, 3n]);
  });
});
