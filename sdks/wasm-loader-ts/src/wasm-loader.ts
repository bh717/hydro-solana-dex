import { prepareWasmResult } from "./prepare-wasm-result";
import { AsyncFnObj, Fn, FnBag, WasmLoaderReturn } from "./types";

// WasmLoader types

// WasmLoader
export function loadWasm<T extends FnBag>(instance: T): WasmLoaderReturn<T> {
  // lazy loading of wasm
  const newObject: Partial<AsyncFnObj<T>> = {};
  let methodNames = Object.keys(instance).filter(
    (i) => i !== "default"
  ) as Array<keyof T>;

  for (let name of methodNames) {
    const fn = instance[name];
    if (!isFn(fn)) continue;
    // Just incase lets bind the fn
    const handler = fn.bind(instance);

    // Here we make the call to the fn
    const asyncHandler = async (...args: any[]) => {
      // We might want to make this idempotent at some point
      // but for now we should wait to see if there are perf impacts
      if (typeof instance.default !== "object") {
        try {
          await instance.default();
        } catch (err) {
          throw new Error("Error loading or initializing wasm.");
        }
      }

      // TODO add return object manipulation
      // Access all properties of structs
      let unparsed: any;
      try {
        unparsed = handler(...args);
      } catch (err: any) {
        // handle specific error codes that make sense for wasm
        // last switch rethrow
        if (err.message === "unreachable") {
          const { stack, message } = err;
          console.log(err);
          err = new Error(
            `An unknown error was thrown while executing the '${name}()' handler in your wasm module.`
          );
          err.stack = stack;
        }
        throw new Error(err?.message || err?.toString() || err);
      }
      const out = prepareWasmResult(unparsed);
      return out;
    };

    // Append to object
    newObject[name] = asyncHandler as any;
  }
  return newObject as WasmLoaderReturn<T>;
}

function isFn(o: any): o is Fn {
  return typeof o === "function";
}
