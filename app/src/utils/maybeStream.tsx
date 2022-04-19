import { Observable } from "rxjs";

export function maybeStream<T>(
  streamOrUndefined: Observable<T> | undefined
): Observable<T | undefined> {
  if (!streamOrUndefined) return new Observable((s) => s.next(undefined));
  return streamOrUndefined;
}
