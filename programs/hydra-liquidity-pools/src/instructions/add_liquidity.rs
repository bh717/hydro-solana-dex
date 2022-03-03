use crate::constants::*;
use crate::errors::ErrorCode;
use crate::events::liquidity_added::LiquidityAdded;
use crate::events::slippage_exceeded::SlippageExceeded;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, MintTo, Token, TokenAccount, Transfer};
use hydra_math_rs::programs::liquidity_pools::hydra_lp_tokens::*;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    /// the authority allowed to transfer token_a and token_b from the users wallet.
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [ POOL_STATE_SEED, pool_state.lp_token_mint.key().as_ref() ],
        bump = pool_state.pool_state_bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    #[account(
        mut,
        constraint = lp_token_mint.key() == pool_state.lp_token_mint.key()
    )]
    pub lp_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = user_base_token.mint == pool_state.base_token_mint.key(),
        constraint = user_base_token.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_base_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_quote_token.mint == pool_state.quote_token_mint.key(),
        constraint = user_quote_token.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_quote_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.base_token_mint.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
        constraint = base_token_vault.key() == pool_state.base_token_vault.key()
    )]
    pub base_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.quote_token_mint.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
        constraint = quote_token_vault.key() == pool_state.quote_token_vault.key()
    )]
    pub quote_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ LP_TOKEN_VAULT_SEED, pool_state.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
    )]
    pub lp_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = lp_token_to.mint == pool_state.lp_token_mint.key(),
    )]
    pub lp_token_to: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

impl<'info> AddLiquidity<'info> {
    pub fn transfer_user_base_token_to_vault(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!("Account balances before transfer...");
            msg!("user_base_token.amount: {}", self.user_base_token.amount);
            msg!("base_token_vault.amount: {}", self.base_token_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.user_base_token.to_account_info(),
            to: self.base_token_vault.to_account_info(),
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
            msg!("user_token_b.amount: {}", self.user_quote_token.amount);
            msg!("token_b_vault.amount: {}", self.quote_token_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.user_quote_token.to_account_info(),
            to: self.quote_token_vault.to_account_info(),
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

    pub fn mint_and_lock_lp_tokens_to_pool_state_account(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.lp_token_mint.to_account_info(),
            to: self.lp_token_vault.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    /// AddLiquidity instruction. See python model here: https://colab.research.google.com/drive/1p0HToo1mxm2Z1e8dpzIvScGrMCrgN6qr?authuser=2#scrollTo=Awc9KZdYEpPn
    pub fn calculate_first_deposit_lp_tokens_to_mint(
        &self,
        base_token_amount: u64,
        quote_token_amount: u64,
    ) -> Option<u64> {
        calculate_k(
            base_token_amount,
            quote_token_amount,
            self.lp_token_mint.supply,
        )
    }

    /// calculate a and b tokens (x/y) from expected_lp_tokens (k)
    pub fn calculate_a_and_b_tokens_to_debit_from_expected_lp_tokens(
        &self,
        expected_lp_tokens_minted: u64,
    ) -> (u64, u64) {
        calculate_x_y(
            expected_lp_tokens_minted,
            self.base_token_vault.amount,
            self.quote_token_vault.amount,
            self.lp_token_mint.supply,
        )
    }
}

pub fn handle(
    ctx: Context<AddLiquidity>,
    base_token_max_amount: u64, // slippage handling: token_a_amount * (1 + TOLERATED_SLIPPAGE) --> calculated in UI
    quote_token_max_amount: u64, // slippage handling: token_b_amount * (1 + TOLERATED_SLIPPAGE) --> calculated in UI
    expected_lp_tokens: u64,     // not used for first deposit.
) -> ProgramResult {
    if ctx.accounts.pool_state.debug {
        msg!("expected_lp_tokens: {}", expected_lp_tokens);
        msg!("base_token_max_amount: {}", base_token_max_amount);
        msg!("quote_token_max_amount: {}", quote_token_max_amount);
    }

    let seeds = &[
        POOL_STATE_SEED,
        ctx.accounts.pool_state.lp_token_mint.as_ref(),
        &[ctx.accounts.pool_state.pool_state_bump],
    ];
    let signer = [&seeds[..]];

    let (base_token_to_debit, quote_token_to_debit, lp_tokens_to_mint);

    // On first deposit
    if let Some(lp_tokens) = ctx
        .accounts
        .calculate_first_deposit_lp_tokens_to_mint(base_token_max_amount, quote_token_max_amount)
    {
        // mint and lock lp tokens on first deposit
        let mut cpi_tx = ctx.accounts.mint_and_lock_lp_tokens_to_pool_state_account();
        cpi_tx.signer_seeds = &signer;
        token::mint_to(cpi_tx, MIN_LIQUIDITY)?;

        if ctx.accounts.pool_state.debug {
            msg!("lp_tokens_locked: {}", MIN_LIQUIDITY);
        }

        base_token_to_debit = base_token_max_amount;
        quote_token_to_debit = quote_token_max_amount;
        lp_tokens_to_mint = lp_tokens;
    } else {
        // On subsequent deposits
        let debited = ctx
            .accounts
            .calculate_a_and_b_tokens_to_debit_from_expected_lp_tokens(expected_lp_tokens);

        base_token_to_debit = debited.0;
        quote_token_to_debit = debited.1;
        lp_tokens_to_mint = expected_lp_tokens;

        if (base_token_to_debit > base_token_max_amount)
            || (quote_token_to_debit > quote_token_max_amount)
        {
            if ctx.accounts.pool_state.debug {
                msg!("Error: SlippageExceeded");
                msg!("base_token_to_debit: {}", base_token_to_debit);
                msg!("base_token_max_amount: {}", base_token_max_amount);
                msg!("quote_token_to_debit: {}", quote_token_to_debit);
                msg!("quote_token_max_amount: {}", quote_token_max_amount);
            }
            emit!(SlippageExceeded {
                base_token_to_debit,
                quote_token_to_debit,
                base_token_max_amount,
                quote_token_max_amount,
            });
            return Err(ErrorCode::SlippageExceeded.into());
        }
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
        base_token_to_debit,
    )?;

    // transfer to vault
    token::transfer(
        ctx.accounts.transfer_user_quote_token_to_vault(),
        quote_token_to_debit,
    )?;

    emit!(LiquidityAdded {
        base_tokens_transferred: base_token_to_debit,
        quote_tokens_transferred: quote_token_to_debit,
        lp_tokens_minted: lp_tokens_to_mint,
    });

    if ctx.accounts.pool_state.debug {
        msg!("lp_tokens_to_mint: {}", lp_tokens_to_mint);
        msg!("base_token_to_debit: {}", base_token_to_debit);
        msg!("quote_token_to_debit: {}", quote_token_to_debit);
    }

    Ok(())
}
