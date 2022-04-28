import { usePoolsList } from "./usePoolsList";

export function usePools() {
  // get form data and controls

  const keys = usePoolsList();
  return keys;
}
