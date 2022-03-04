import { Ctx } from "../types";
import { inject } from "../utils/meta-utils";
import * as api from "./api";

export default (ctx: Ctx) => {
  return inject(api, ctx);
};
