type CurryFn<A> = (a: A) => (...args: any) => any;
type FnFromCurry<T extends CurryFn<any>> = ReturnType<T>;

type InputObj<T> = Record<string, CurryFn<T>>;

type Output<T extends InputObj<any>> = { [K in keyof T]: FnFromCurry<T[K]> };

/**
 * Injects context in obj
 * @param obj
 * @param ctx
 * @returns
 */
export function injectContext<T>(
  obj: InputObj<T>,
  ctx: T
): Output<InputObj<T>> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v(ctx)]));
}
