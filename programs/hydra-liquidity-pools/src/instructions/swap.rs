use crate::constants::*;
use crate::errors::ErrorCode;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use hydra_math_rs::programs::liquidity_pools::swap_calculator::{swap_x_to_y_hmm, swap_y_to_x_hmm};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        constraint = token_x_mint.key() == pool_state.token_x_mint
    )]
    pub token_x_mint: Box<Account<'info, Mint>>,

    #[account(
        constraint = token_y_mint.key() == pool_state.token_y_mint
    )]
    pub token_y_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [ POOL_STATE_SEED, pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.pool_state_bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    #[account(
        mut,
        seeds = [ LP_TOKEN_MINT_SEED, pool_state.token_x_mint.as_ref(), pool_state.token_y_mint.as_ref() ],
        bump,
        constraint = lp_token_mint.key() == pool_state.lp_token_mint,
    )]
    pub lp_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = user_from_token.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_from_token: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = user_to_mint,// ???
        associated_token::authority = user,
        constraint = user_to_token.owner == user.key()
    )]
    /// token account to send too.  
    pub user_to_token: Box<Account<'info, TokenAccount>>,

    /// token_a_mint. Eg BTC
    #[account(
        constraint = user_to_mint.key() == pool_state.token_x_mint || user_to_mint.key() == pool_state.token_y_mint,
        constraint = user_to_token.owner == user.key()
    )]
    pub user_to_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.token_x_mint.as_ref(), pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.token_x_vault_bump,
        constraint = token_x_vault.key() == pool_state.token_x_vault,
    )]
    pub token_x_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.token_y_mint.as_ref(), pool_state.lp_token_mint.as_ref() ],
        bump = pool_state.token_y_vault_bump,
        constraint = token_y_vault.key() == pool_state.token_y_vault,
    )]
    pub token_y_vault: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Swap<'info> {
    pub fn post_transfer_checks(&mut self, result: Vec<u64>) -> Result<()> {
        // post tx checks
        (&mut self.token_x_vault).reload()?;
        (&mut self.token_y_vault).reload()?;

        if result[0] != self.token_x_vault.amount {
            msg!("x_new: {:?}", result[0]);
            msg!("token_x_vault.amount: {:?}", self.token_x_vault.amount);
            return Err(ErrorCode::InvalidVaultToSwapResultAmounts.into());
        }

        if result[1] != self.token_y_vault.amount {
            msg!("y_new: {:?}", result[1]);
            msg!("token_y_vault.amount: {:?}", self.token_y_vault.amount);
            return Err(ErrorCode::InvalidVaultToSwapResultAmounts.into());
        }

        // TODO: Broken for some random reason... Come back to laterz
        // if result.squared_k_down() != self.lp_token_mint.supply {
        //     msg!("squared_k_down: {:?}", result.squared_k_down());
        //     msg!("lp_token_mint.supply: {:?}", self.lp_token_mint.supply);
        //     return Err(ErrorCode::InvalidVaultToSwapResultAmounts.into());
        // }
        Ok(())
    }

    pub fn transfer_tokens_to_user(
        &self,
        from_account: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!(
                "from: self.token_y_vault.amount: {}",
                self.token_y_vault.amount
            );
            msg!(
                "to: self.user_to_token.amount: {}",
                self.user_to_token.amount
            );
        }

        let cpi_accounts = Transfer {
            from: from_account,
            to: self.user_to_token.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn transfer_user_tokens_to_vault(
        &self,
        to_account: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!(
                "from: self.user_from_token.amount: {}",
                self.user_from_token.amount
            );
            msg!(
                "to: self.token_x_vault.amount: {}",
                self.token_x_vault.amount
            );
        }

        let cpi_accounts = Transfer {
            from: self.user_from_token.to_account_info(),
            to: to_account,
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

// security check mint addresses are both correct as per the pool state object.
pub fn check_mint_addresses(ctx: &Context<Swap>) -> Result<()> {
    let mut user_to_token_valid = false;
    let mut user_from_token_valid = false;

    if ctx.accounts.user_to_token.mint == ctx.accounts.pool_state.token_x_mint {
        user_to_token_valid = true;
    }

    if ctx.accounts.user_to_token.mint == ctx.accounts.pool_state.token_y_mint {
        user_to_token_valid = true;
    }

    if ctx.accounts.user_from_token.mint == ctx.accounts.pool_state.token_x_mint {
        user_from_token_valid = true;
    }

    if ctx.accounts.user_from_token.mint == ctx.accounts.pool_state.token_y_mint {
        user_from_token_valid = true;
    }

    // if both mint's arent valid return an error.
    if !(user_to_token_valid && user_from_token_valid) {
        return Err(ErrorCode::InvalidMintAddress.into());
    }

    Ok(())
}

pub fn handle(ctx: Context<Swap>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    let transfer_in_amount = amount_in;

    // signer
    let seeds = &[
        POOL_STATE_SEED,
        ctx.accounts.pool_state.lp_token_mint.as_ref(),
        &[ctx.accounts.pool_state.pool_state_bump],
    ];
    let signer = [&seeds[..]];

    // detect swap direction. x to y
    if ctx.accounts.user_from_token.mint == ctx.accounts.pool_state.token_x_mint {
        msg!("Swapping: x to y");
        // confirm the other side matches pool state of y
        if ctx.accounts.user_to_token.mint != ctx.accounts.pool_state.token_y_mint {
            return Err(ErrorCode::InvalidMintAddress.into());
        }

        let swap_result = swap_x_to_y_hmm(
            ctx.accounts.token_x_vault.amount,
            ctx.accounts.token_x_mint.decimals,
            ctx.accounts.token_y_vault.amount,
            ctx.accounts.token_y_mint.decimals,
            ctx.accounts.pool_state.compensation_parameter,
            // TODO: get oracle price i and scale from pyth
            0,
            0,
            ctx.accounts.pool_state.fees.swap_fee_numerator,
            ctx.accounts.pool_state.fees.swap_fee_denominator,
            amount_in,
        )
        .expect("swap_result");

        let transfer_out_amount = swap_result[1]; // delta_y

        check_slippage(
            &amount_in,
            &minimum_amount_out,
            &transfer_in_amount,
            &transfer_out_amount,
        )?;

        // transfer x to vault
        msg!("transfer_in_amount: {}", transfer_in_amount);
        token::transfer(
            ctx.accounts
                .transfer_user_tokens_to_vault(ctx.accounts.token_x_vault.to_account_info()),
            transfer_in_amount,
        )?;

        // transfer y to user
        msg!("transfer_out_amount: {:?}", transfer_out_amount);
        token::transfer(
            ctx.accounts
                .transfer_tokens_to_user(ctx.accounts.token_y_vault.to_account_info())
                .with_signer(&signer),
            transfer_out_amount,
        )?;
    }

    // detect swap direction y to x
    if ctx.accounts.user_from_token.mint == ctx.accounts.pool_state.token_y_mint {
        msg!("Swapping: y to x");
        // confirm the other side matches the pool state of x
        if ctx.accounts.user_to_token.mint != ctx.accounts.pool_state.token_x_mint {
            return Err(ErrorCode::InvalidMintAddress.into());
        }

        let swap_result = swap_y_to_x_hmm(
            ctx.accounts.token_x_vault.amount,
            ctx.accounts.token_x_mint.decimals,
            ctx.accounts.token_y_vault.amount,
            ctx.accounts.token_y_mint.decimals,
            ctx.accounts.pool_state.compensation_parameter,
            // TODO: get oracle price i and scale from pyth
            0,
            0,
            ctx.accounts.pool_state.fees.swap_fee_numerator,
            ctx.accounts.pool_state.fees.swap_fee_denominator,
            amount_in,
        )
        .expect("swap_result");

        let transfer_out_amount = swap_result[0]; // delta_x

        check_slippage(
            &amount_in,
            &minimum_amount_out,
            &transfer_in_amount,
            &transfer_out_amount,
        )?;

        // transfer y to vault
        msg!("transfer_in_amount: {}", transfer_in_amount);
        token::transfer(
            ctx.accounts
                .transfer_user_tokens_to_vault(ctx.accounts.token_y_vault.to_account_info()),
            transfer_in_amount,
        )?;

        // transfer x to user
        msg!("transfer_out_amount: {:?}", transfer_out_amount);
        token::transfer(
            ctx.accounts
                .transfer_tokens_to_user(ctx.accounts.token_x_vault.to_account_info())
                .with_signer(&signer),
            transfer_out_amount,
        )?;

        // TODO: check all amounts are correct
        // ctx.accounts.post_transfer_checks(swap_result)?;
    }

    Ok(())
}

/// check amounts are within slippage or return an error
fn check_slippage(
    amount_in: &u64,
    minimum_amount_out: &u64,
    transfer_in_amount: &u64,
    transfer_out_amount: &u64,
) -> Result<()> {
    // check slippage for amount_out
    if transfer_out_amount < minimum_amount_out {
        msg!("SlippageExceeded!");
        msg!("transfer_out_amount: {:?}", transfer_out_amount);
        msg!("minimum_amount_out: {:?}", minimum_amount_out);
        return Err(ErrorCode::SlippageExceeded.into());
    }

    // check slippage for amount_in
    if transfer_in_amount > amount_in {
        msg!("SlippageExceeded!");
        msg!("transfer_in_amount: {:?}", transfer_in_amount);
        msg!("amount_in: {:?}", amount_in);
        return Err(ErrorCode::SlippageExceeded.into());
    }
    Ok(())
}
