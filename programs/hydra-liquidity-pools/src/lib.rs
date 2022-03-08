extern crate core;

mod errors;
mod events;
mod instructions;
pub mod state;
mod utils;

use instructions::add_liquidity::*;
use instructions::initialize::*;
use instructions::remove_liquidity::*;
use instructions::swap_cpmm::*;

use anchor_lang::prelude::*;
// use anchor_lang::solana_program::log::sol_log_compute_units;
// use hydra_math::swap_calculator::SwapCalculator;

declare_id!("BBjT5U42SuA6FcVZEofPgjAVZahvtWzHaQ8pJHyKkC5T");

#[cfg(any(feature = "localnet", feature = "devnet", feature = "testnet"))]
pub const DEBUG_MODE: bool = true;

#[cfg(feature = "mainnet")]
pub const DEBUG_MODE: bool = false;

pub mod constants {
    pub const LP_TOKEN_VAULT_SEED: &[u8] = b"lp_token_vault_seed";
    pub const TOKEN_VAULT_SEED: &[u8] = b"token_vault_seed";
    pub const POOL_STATE_SEED: &[u8] = b"pool_state_seed";
}

#[program]
pub mod hydra_liquidity_pools {
    use super::*;

    /// initialize a new empty pool
    pub fn initialize(
        ctx: Context<Initialize>,
        base_token_vault_bump: u8,
        quote_token_vault_bump: u8,
        pool_state_bump: u8,
        lp_token_vault_bump: u8,
        compensation_parameter: u16,
    ) -> Result<()> {
        instructions::initialize::handle(
            ctx,
            base_token_vault_bump,
            quote_token_vault_bump,
            pool_state_bump,
            lp_token_vault_bump,
            compensation_parameter,
        )
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        base_tokens_max_amount: u64, // slippage handling: token_a_amount * (1 + TOLERATED_SLIPPAGE) --> calculated client side
        quote_tokens_max_amount: u64, // slippage handling: token_b_amount * (1 + TOLERATED_SLIPPAGE) --> calculated client side
        expected_lp_tokens: u64,
    ) -> Result<()> {
        instructions::add_liquidity::handle(
            ctx,
            base_tokens_max_amount,
            quote_tokens_max_amount,
            expected_lp_tokens,
        )
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_tokens_to_burn: u64, // calculate the % client side
    ) -> Result<()> {
        instructions::remove_liquidity::handle(ctx, lp_tokens_to_burn)
    }

    pub fn swap_cpmm(
        ctx: Context<SwapCpmm>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        instructions::swap_cpmm::handle(ctx, amount_in, minimum_amount_out)
    }

    // pub fn swap_amm(ctx: Context<Swap>) -> ProgramResult {
    //     let swap_result = &mut ctx.accounts.swap_result;
    //     let swap = SwapCalculator::new(1000, 1000, 0, 1);
    // let swap_x_to_y_amm = swap.swap_x_to_y_amm(5);
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
