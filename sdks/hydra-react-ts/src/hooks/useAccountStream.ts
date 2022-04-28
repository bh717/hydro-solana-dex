import { IAccountLoader } from "hydra-ts";
import { useMemo } from "react";
import { useObservable } from "./useObservable";
import { maybeStream } from "hydra-ts";
export function useAccountStream<T>(loader?: IAccountLoader<T>) {
  // Plan here is that this hook will in the near future:
  // 1. Synchronously find the given stream from a set of memoized streams or add a stream to the set
  // 2. Deliver the current latest value of the stream synchronously
  // 3. Continue to deliver values as they come in
  const memoizedStream = useMemo(() => {
    return maybeStream(loader?.stream());
  }, [loader]);

  return useObservable(memoizedStream);
}
