import { Ctx } from "../types";
import { inject, withAccounts } from "../utils/meta-utils";
import accounts from "./accounts";
import { calculatePoolTokensForDeposit } from "./calculatePoolTokensForDeposit";
import { calculatePoolTokensForWithdraw } from "./calculatePoolTokensForWithdraw";
import { stake } from "./stake";
import { unstake } from "./unstake";
import { initialize } from "./initialize";

export default (ctx: Ctx) => {
  return withAccounts(
    ctx,
    accounts,
    inject(
      {
        calculatePoolTokensForDeposit,
        calculatePoolTokensForWithdraw,
        stake,
        unstake,
        initialize,
      },
      ctx
    )
  );
};
