import { prepareWasmResult } from "./prepare-wasm-result";

// WasmLoader types

// Function
type Fn = (...args: any) => any;

// Bag of Functions but possibly objects this is similar to what we get from wasm
type FnBag = Record<string, Fn | object>;

// Utility to convert between a function and another that is an asynchronous version of itself
type AsyncFn<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

// Convert all props on given object type that are functions to the async version of themselves
type AsyncFnObj<T extends { [k in keyof T]: Fn | object }> =
  | {
      [K in keyof T]: T[K] extends Fn ? AsyncFn<T[K]> : T[K];
    };

// Types for loader function
type WasmLoaderReturn<T extends FnBag> = Omit<AsyncFnObj<T>, "default">;

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
        await instance.default();
      }
      // TODO add return object manipulation
      // Access all properties of structs
      // Handle Option<T> and throw errors accordingly
      const out = prepareWasmResult(handler(...args));
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
