export async function filterAsync<T>(
  items: T[],
  predicate: (item: T) => Promise<boolean>
) {
  const predicateResult = await Promise.all(items.map(predicate));
  return items.filter((item, index) => predicateResult[index]);
}
