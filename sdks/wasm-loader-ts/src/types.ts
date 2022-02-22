// Function
export type Fn = (...args: any) => any;

// Bag of Functions but possibly objects this is similar to what we get from wasm
export type FnBag = Record<string, Fn | object>;

// Utility to convert between a function and another that is an asynchronous version of itself
export type AsyncFn<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

// Convert all props on given object type that are functions to the async version of themselves
export type AsyncFnObj<T extends { [k in keyof T]: Fn | object }> =
  | {
      [K in keyof T]: T[K] extends Fn ? AsyncFn<T[K]> : T[K];
    };

// Types for loader function
export type WasmLoaderReturn<T extends FnBag> = Omit<AsyncFnObj<T>, "default">;
