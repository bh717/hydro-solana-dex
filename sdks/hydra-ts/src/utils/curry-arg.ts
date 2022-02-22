type CurryFn<Ctx> = (a: Ctx) => (...args: any) => any;
type FnFromCurry<Ctx, T extends CurryFn<Ctx>> = ReturnType<T>;

export type InputObj<Ctx> = Record<string, CurryFn<Ctx>>;

export type Output<Ctx, T extends InputObj<Ctx>> = {
  [K in keyof T]: FnFromCurry<Ctx, T[K]>;
};

/**
 * Injects context in obj
 * @param obj
 * @param ctx
 * @returns
 */

// type InjectableContext<T> = (obj: InputObj<T>, ctx: T) => Output<InputObj<T>>;

export function injectContext<Ctx, T extends InputObj<Ctx>>(
  obj: T,
  ctx: Ctx
): Output<Ctx, T> {
  type Out = Output<Ctx, T>;

  const entries = Object.entries(obj);
  const out = entries.reduce((acc: Out, [k, curryFn]) => {
    return {
      ...acc,
      [k]: curryFn(ctx),
    } as Out;
  }, {} as Out);

  return out;
}
