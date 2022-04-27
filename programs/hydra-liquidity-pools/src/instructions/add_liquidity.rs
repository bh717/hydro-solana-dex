use crate::constants::*;
use crate::errors::ErrorCode;
use crate::events::liquidity_added::LiquidityAdded;
use crate::events::slippage_exceeded::SlippageExceeded;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token;
use anchor_spl::token::{Mint, MintTo, Token, TokenAccount, Transfer};
use hydra_math_rs::programs::liquidity_pools::hydra_lp_tokens::*;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    /// the authority allowed to transfer token_a and token_b from the users wallet.
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
        constraint = user_token_x.mint == pool_state.token_x_mint,
        constraint = user_token_x.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_token_x: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_token_y.mint == pool_state.token_y_mint,
        constraint = user_token_y.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_token_y: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.token_x_mint.as_ref(), lp_token_mint.key().as_ref() ],
        bump,
        constraint = token_x_vault.key() == pool_state.token_x_vault,
    )]
    pub token_x_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.token_y_mint.as_ref(), lp_token_mint.key().as_ref() ],
        bump,
        constraint = token_y_vault.key() == pool_state.token_y_vault,
    )]
    pub token_y_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ LP_TOKEN_VAULT_SEED, pool_state.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
    )]
    pub lp_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = lp_token_mint,
        associated_token::authority = user
    )]
    pub lp_token_to: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> AddLiquidity<'info> {
    pub fn transfer_user_base_token_to_vault(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!("Account balances before transfer...");
            msg!("user_token_x.amount: {}", self.user_token_x.amount);
            msg!("token_x_vault.amount: {}", self.token_x_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.user_token_x.to_account_info(),
            to: self.token_x_vault.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn transfer_user_quote_token_to_vault(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!("Account balances before transfer...");
            msg!("user_token_y.amount: {}", self.user_token_y.amount);
            msg!("token_y_vault.amount: {}", self.token_y_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.user_token_y.to_account_info(),
            to: self.token_y_vault.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn mint_lp_tokens_to_user_account(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.lp_token_mint.to_account_info(),
            to: self.lp_token_to.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    /// calculate a and b tokens (x/y) from expected_lp_tokens (k)
    pub fn calculate_a_and_b_tokens_to_debit_from_expected_lp_tokens(
        &self,
        expected_lp_tokens_minted: u64,
    ) -> (u64, u64) {
        calculate_x_y(
            expected_lp_tokens_minted,
            self.lp_token_mint.decimals,
            self.token_x_vault.amount,
            self.token_x_mint.decimals,
            self.token_y_vault.amount,
            self.token_y_mint.decimals,
            self.lp_token_mint.supply,
        )
    }
}

pub fn handle(
    ctx: Context<AddLiquidity>,
    token_x_max_amount: u64, // slippage handling: token_a_amount * (1 + TOLERATED_SLIPPAGE) --> calculated in UI
    token_y_max_amount: u64, // slippage handling: token_b_amount * (1 + TOLERATED_SLIPPAGE) --> calculated in UI
    expected_lp_tokens: u64, //
) -> Result<()> {
    // Pool needs to be funded for the first time via instruction addFirstLiquidity
    if ctx.accounts.lp_token_mint.supply == 0 {
        return Err(ErrorCode::PoolNotFunded.into());
    }

    if ctx.accounts.pool_state.debug {
        msg!("expected_lp_tokens: {}", expected_lp_tokens);
        msg!("token_x_max_amount: {}", token_x_max_amount);
        msg!("token_y_max_amount: {}", token_y_max_amount);
    }

    let seeds = &[
        POOL_STATE_SEED,
        ctx.accounts.pool_state.lp_token_mint.as_ref(),
        &[ctx.accounts.pool_state.pool_state_bump],
    ];
    let signer = [&seeds[..]];

    let debited = ctx
        .accounts
        .calculate_a_and_b_tokens_to_debit_from_expected_lp_tokens(expected_lp_tokens);

    let token_x_to_debit = debited.0;
    let token_y_to_debit = debited.1;
    let lp_tokens_to_mint = expected_lp_tokens;

    if (token_x_to_debit > token_x_max_amount) || (token_y_to_debit > token_y_max_amount) {
        if ctx.accounts.pool_state.debug {
            msg!("Error: SlippageExceeded");
            msg!("token_x_to_debit: {}", token_x_to_debit);
            msg!("token_x_max_amount: {}", token_x_max_amount);
            msg!("token_y_to_debit: {}", token_y_to_debit);
            msg!("token_y_max_amount: {}", token_y_max_amount);
        }
        emit!(SlippageExceeded {
            token_x_to_debit,
            token_y_to_debit,
            token_x_max_amount,
            token_y_max_amount,
        });
        return Err(ErrorCode::SlippageExceeded.into());
    }

    // mint lp tokens to users account
    token::mint_to(
        ctx.accounts
            .mint_lp_tokens_to_user_account()
            .with_signer(&signer),
        lp_tokens_to_mint,
    )?;

    // transfer to vault
    token::transfer(
        ctx.accounts.transfer_user_base_token_to_vault(),
        token_x_to_debit,
    )?;

    // transfer to vault
    token::transfer(
        ctx.accounts.transfer_user_quote_token_to_vault(),
        token_y_to_debit,
    )?;

    emit!(LiquidityAdded {
        tokens_x_transferred: token_x_to_debit,
        tokens_y_transferred: token_y_to_debit,
        lp_tokens_minted: lp_tokens_to_mint,
    });

    if ctx.accounts.pool_state.debug {
        msg!("lp_tokens_to_mint: {}", lp_tokens_to_mint);
        msg!("token_x_to_debit: {}", token_x_to_debit);
        msg!("token_y_to_debit: {}", token_y_to_debit);
    }

    Ok(())
}
