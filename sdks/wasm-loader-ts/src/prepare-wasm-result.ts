/**
 * Wasm returns pointers to heap objects that can be freed and have rust like properties. We don't
 * want this in javascript land. This object accesses the getters to receive the props from the object
 * Then frees the object to avoid held memory.
 * @param o object returned from wasm
 * @returns a normal javascript object with the properties of the object returned
 */

export function prepareWasmResult<T>(o: T): Omit<T, "free"> {
  // If bigint or number or other type of value just return it
  if (typeof o !== "object") return o;

  // Our object is a struct
  const oldObj = o as any;
  const newObj = {} as any;

  // Extract the unique props of our struct
  const keys = getRustStructPropKeys(o);

  // Iterate through them and assign them to a new object
  for (let key of keys) {
    newObj[key] = oldObj[key];
  }

  // Free the memory if we can
  if (typeof oldObj.free === "function") oldObj.free();

  // Return
  return newObj as T;
}

// Recursively get all props enumerable or otherwise on the object
// Wasm bidings seem to make properties non enumerable for some weird reason.
function getAllPropertyNamesEver(o: any, prev: string[] = []): string[] {
  if (o) {
    const n = Object.getOwnPropertyNames(o);
    return getAllPropertyNamesEver(Object.getPrototypeOf(o), prev.concat(n));
  }
  return prev.sort();
}

// Filter out known props that are not fields
function filterPropertyNames(names: string[]) {
  // Use a map for quick mathing
  const propMap: Record<string, number> = {
    __defineGetter__: 1,
    __defineSetter__: 1,
    __destroy_into_raw: 1,
    __lookupGetter__: 1,
    __lookupSetter__: 1,
    __proto__: 1,
    constructor: 1,
    free: 1,
    hasOwnProperty: 1,
    isPrototypeOf: 1,
    propertyIsEnumerable: 1,
    ptr: 1,
    toLocaleString: 1,
    toString: 1,
    valueOf: 1,
  };
  return names.filter((name) => !propMap[name]);
}

function getRustStructPropKeys(o: any) {
  const allProps = getAllPropertyNamesEver(o);
  return filterPropertyNames(allProps);
}
