use crate::constants::*;
use crate::events::liquidity_removed::LiquidityRemoved;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Burn, Mint, Token, TokenAccount, Transfer};
use hydra_math_rs::programs::liquidity_pools::hydra_lp_tokens::*;

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(
        mut,
        seeds = [ POOL_STATE_SEED, pool_state.lp_token_mint.key().as_ref() ],
        bump = pool_state.pool_state_bump,
        has_one = base_token_vault.key(),
        has_one = quote_token_vault.key(),
        has_one = lp_token_mint.key(),
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    /// the authority allowed to transfer token_a and token_b from the users wallet.
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_redeemable_lp_tokens.mint == pool_state.lp_token_mint.key(),
        constraint = user_redeemable_lp_tokens.owner ==  user.key(),
    )]
    pub user_redeemable_lp_tokens: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_base_token.mint == pool_state.base_token_mint.key(),
        constraint = user_base_token.owner == user.key()
    )]
    /// the token account to send token_a's back to
    pub user_base_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_quote_token.mint == pool_state.quote_token_mint.key(),
        constraint = user_quote_token.owner == user.key()
    )]
    ///  the token account to send token_b's back to
    pub user_quote_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.base_token_mint.key().as_ref(), pool_state.lp_token_mint.key().as_ref() ],
        bump,
        constraint = base_token_vault.key() == pool_state.base_token_vault.key()
    )]
    pub base_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.quote_token_mint.key().as_ref(), pool_state.lp_token_mint.key().as_ref() ],
        bump,
        constraint = quote_token_vault.key() == pool_state.quote_token_vault.key()
    )]
    pub quote_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = lp_token_mint.key() == pool_state.lp_token_mint.key()
    )]
    pub lp_token_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
}

impl<'info> RemoveLiquidity<'info> {
    pub fn credit_user_token_a_from_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!("Account balances before transfer...");
            msg!(
                "user_token_a_to_receive.amount: {}",
                self.user_base_token.amount
            );
            msg!("token_a_vault.amount: {}", self.base_token_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.base_token_vault.to_account_info(),
            to: self.user_base_token.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn credit_user_token_b_from_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!("Account balances before transfer...");
            msg!(
                "user_token_b_to_receive.amount: {}",
                self.user_quote_token.amount
            );
            msg!("token_b_vault.amount: {}", self.quote_token_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.quote_token_vault.to_account_info(),
            to: self.user_quote_token.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn burn_lp_tokens(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: self.lp_token_mint.to_account_info(),
            to: self.user_redeemable_lp_tokens.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn calculate_a_and_b_tokens_to_credit_from_lp_tokens(
        &self,
        lp_tokens_to_burn: u64,
    ) -> (u64, u64) {
        calculate_x_y(
            lp_tokens_to_burn,
            self.base_token_vault.amount,
            self.quote_token_vault.amount,
            self.lp_token_mint.supply,
        )
    }
}

pub fn handle(ctx: Context<RemoveLiquidity>, lp_tokens_to_burn: u64) -> ProgramResult {
    let seeds = &[
        POOL_STATE_SEED,
        ctx.accounts.pool_state.lp_token_mint.as_ref(),
        &[ctx.accounts.pool_state.pool_state_bump],
    ];
    let signer = [&seeds[..]];

    let (token_a_to_credit, token_b_to_credit) = ctx
        .accounts
        .calculate_a_and_b_tokens_to_credit_from_lp_tokens(lp_tokens_to_burn);

    if ctx.accounts.pool_state.debug {
        msg!("lp_tokens_to_burn: {}", lp_tokens_to_burn);
        msg!("token_a_to_credit: {}", token_a_to_credit);
        msg!("token_b_to_credit: {}", token_b_to_credit);
    }

    // burn lp tokens
    token::burn(ctx.accounts.burn_lp_tokens(), lp_tokens_to_burn)?;

    // transfer user_token_a to vault
    token::transfer(
        ctx.accounts
            .credit_user_token_a_from_vault()
            .with_signer(&signer),
        token_a_to_credit,
    )?;

    // transfer user_token_b to vault
    token::transfer(
        ctx.accounts
            .credit_user_token_b_from_vault()
            .with_signer(&signer),
        token_b_to_credit,
    )?;

    emit!(LiquidityRemoved {
        tokens_a_credited: token_a_to_credit,
        tokens_b_credited: token_b_to_credit,
        lp_tokens_burnt: lp_tokens_to_burn,
    });

    if ctx.accounts.pool_state.debug {
        msg!("lp_tokens_to_burn: {}", lp_tokens_to_burn);
        msg!("token_a_to_credit: {}", token_a_to_credit);
        msg!("token_b_to_credit: {}", token_b_to_credit);
    }

    Ok(())
}
