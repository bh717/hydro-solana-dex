import { Ctx } from "../types";

type CtxFn<Ctx> = (a: Ctx) => any;

type Injected<T, Ctx> = T extends Record<string, CtxFn<Ctx>>
  ? { [k in keyof T]: ReturnType<T[k]> }
  : never;

export function inject<T, U>(obj: T, arg: U): Injected<T, U> {
  const entries = Object.entries(obj);
  const out = entries.reduce(
    (acc, [k, curryFn]) => ({
      ...acc,
      [k]: curryFn(arg),
    }),
    {} as Injected<T, U>
  );

  return out;
}

/**
 * Add accounts to object allowing for lazy account retieval
 * @param obj - object to decorate with accounts prop
 * @param acc - function to bind accounts with ctx
 * @param ctx - context
 * @returns
 */
export function withAccounts<T, U>(
  obj: T,
  acc: (c: Ctx) => U,
  ctx: Ctx
): T & { readonly accounts: U } {
  return Object.defineProperty(obj, "accounts", {
    get: function () {
      return acc(ctx);
    },
  }) as T & { readonly accounts: U };
}
