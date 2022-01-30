mod instructions;
pub mod state;

use instructions::add_liquidity::*;
use instructions::initialize::*;

use anchor_lang::prelude::*;
// use anchor_lang::solana_program::log::sol_log_compute_units;
// use hydra_math::swap_calculator::SwapCalculator;

declare_id!("BBjT5U42SuA6FcVZEofPgjAVZahvtWzHaQ8pJHyKkC5T");

pub mod constants {
    pub const TOKEN_VAULT_SEED: &[u8] = b"token_vault_seed";
    pub const POOL_STATE_SEED: &[u8] = b"pool_state_seed";
}

#[program]
pub mod hydra_liquidity_pools {
    use super::*;

    /// initialise a new empty pool
    pub fn initialize(
        ctx: Context<Initialize>,
        token_a_vault_bump: u8,
        token_b_vault_bump: u8,
        pool_state_bump: u8,
    ) -> ProgramResult {
        instructions::initialize::handle(
            ctx,
            token_a_vault_bump,
            token_b_vault_bump,
            pool_state_bump,
        )
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        token_a_amount: u64,
        token_b_amount: u64,
    ) -> ProgramResult {
        instructions::add_liquidity::handle(ctx, token_a_amount, token_b_amount)
    }

    // pub fn swap_amm(ctx: Context<Swap>) -> ProgramResult {
    //     let swap_result = &mut ctx.accounts.swap_result;
    //     let swap = SwapCalculator::new(1000, 1000, 0, 1);
    //     let swap_x_to_y_amm = swap.swap_x_to_y_amm(5);
    //     sol_log_compute_units();
    //     msg!("delta Y is: {:?}", swap_x_to_y_amm.delta_y.value.0);
    //     swap_result.x_new = swap_x_to_y_amm.x_new.to_imprecise().unwrap();
    //     swap_result.y_new = swap_x_to_y_amm.y_new.to_imprecise().unwrap();
    //     swap_result.delta_x = swap_x_to_y_amm.delta_x.to_imprecise().unwrap();
    //     swap_result.delta_y = swap_x_to_y_amm.delta_y.to_imprecise().unwrap();
    //     Ok(())
    // }
    //
    // pub fn swap_hmm(ctx: Context<Swap>) -> ProgramResult {
    //     let swap_result = &mut ctx.accounts.swap_result;
    //     let swap = SwapCalculator::new(4200, 69420, 1, 1);
    //     let swap_x_to_y_amm = swap.swap_x_to_y_hmm(20);
    //     sol_log_compute_units();
    //     msg!("delta Y is: {:?}", swap_x_to_y_amm.delta_y.value.0);
    //     swap_result.x_new = swap_x_to_y_amm.x_new.to_imprecise().unwrap();
    //     swap_result.y_new = swap_x_to_y_amm.y_new.to_imprecise().unwrap();
    //     swap_result.delta_x = swap_x_to_y_amm.delta_x.to_imprecise().unwrap();
    //     swap_result.delta_y = swap_x_to_y_amm.delta_y.to_imprecise().unwrap();
    //     Ok(())
    // }
}

// #[derive(Accounts)]
// pub struct Initialize<'info> {
//     #[account(init, payer = user, space = 8 + 512)]
//     pub swap_result: Account<'info, SwapResult>,
//     #[account(mut)]
//     pub user: Signer<'info>,
//     pub system_program: Program<'info, System>,
// }

// #[derive(Accounts)]
// pub struct Swap<'info> {
//     #[account(mut, has_one = authority)]
//     pub swap_result: Account<'info, SwapResult>,
//     pub authority: Signer<'info>,
// }

// #[account]
// pub struct SwapResult {
//     pub authority: Pubkey,
//     pub x_new: u128,
//     pub y_new: u128,
//     pub delta_x: u128,
//     pub delta_y: u128,
// }
