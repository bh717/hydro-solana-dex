import { Ctx } from "../types";
import { inject, withAccounts } from "../utils/meta-utils";
import accounts from "./accounts";
import * as api from "./api";

export default (ctx: Ctx) => withAccounts(inject(api, ctx), accounts, ctx);
