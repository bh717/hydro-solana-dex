import { Ctx } from "../types";
import { inject } from "../utils/meta-utils";
import * as accountLoaders from "./accounts";
import * as api from "./api";

export default (ctx: Ctx) => {
  const methods = inject(api, ctx);
  const accounts = inject(accountLoaders, ctx);
  return { ...methods, accounts };
};
