type ToStringable = { toString(): string };

export function cache<T, K extends ToStringable>(
  store: Map<any, any>,
  key: K,
  setter: () => T
): T {
  const id = key.toString();
  const hit = store.get(id);
  if (hit) return hit as T;
  const newObj = setter();
  store.set(id, newObj);
  return newObj as T;
}
