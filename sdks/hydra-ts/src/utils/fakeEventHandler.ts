export function fakeEventHandler(options?: { buffer: boolean }) {
  const isBuffer = options?.buffer;
  const buffer: any[] = [];
  type Callback = (info: any) => void;
  let _callback: Callback = (event) => {
    if (!isBuffer) {
      throw new Error("emit called before listener");
    }

    if (isBuffer) {
      buffer.push(event);
    }
  };
  function onChange(key: any, callback: (event: any) => void, commitment: any) {
    _callback = callback;
    if (buffer.length) {
      buffer.forEach(_callback);
    }
  }

  function emit(event: any) {
    _callback(event);
  }
  return [onChange, emit] as [typeof onChange, typeof emit];
}
