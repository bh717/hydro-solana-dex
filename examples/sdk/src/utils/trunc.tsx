export function trunc(str: string) {
  return [str.slice(0, 4), str.slice(-4)].join("..");
}
