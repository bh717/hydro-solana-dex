import { Ctx } from "..";
import { merge } from "lodash";

export function getMockCtx(override?: any) {
  const base = {
    connection: {
      getAccountInfo() {
        return null;
      },
    },
  };
  return merge(base, override) as any as Ctx;
}
