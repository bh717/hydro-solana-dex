import { Ctx } from "../types";

type CtxFn<Ctx> = (a: Ctx) => any;
type UnwrapCtxFn<Ctx, T extends CtxFn<Ctx>> = ReturnType<T>;

type Injected<T, Ctx> = T extends Record<string, CtxFn<Ctx>>
  ? { [k in keyof T]: UnwrapCtxFn<Ctx, T[k]> }
  : never;

// type ReturnOf<T> = T extends (a: any) => infer Q ? Q : never;

export function inject<T, U>(obj: T, arg: U): Injected<T, U> {
  const entries = Object.entries(obj);
  const out = entries.reduce((acc, [k, curryFn]) => {
    return {
      ...acc,
      [k]: curryFn(arg),
    };
  }, {});

  return out as Injected<T, U>;
}

export function withAccounts<T, U>(
  ctx: Ctx,
  acc: (c: Ctx) => U,
  obj: T
): T & { readonly accounts: U } {
  return Object.defineProperty(obj, "accounts", {
    get: function () {
      return acc(ctx);
    },
  }) as T & { readonly accounts: U };
}
