use crate::constants::*;
use crate::errors::ErrorCode;
use crate::events::liquidity_added::LiquidityAdded;
use crate::events::slippage_exceeded::SlippageExceeded;
use crate::state::pool_state::PoolState;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, MintTo, Token, TokenAccount, Transfer};
use hydra_math_rs::programs::hydra_lp_tokens::{calculate_k, calculate_x_y};

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

    // TODO: Look into if the mints are required to be sent into the add_liquidity instructions seeing as they exist in the pool_state and arent really used.
    #[account(
        constraint = token_a_mint.key() == pool_state.token_a_mint.key()
    )]
    pub token_a_mint: Box<Account<'info, Mint>>,

    #[account(
        constraint = token_b_mint.key() == pool_state.token_b_mint.key()
    )]
    pub token_b_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = lp_token_mint.key() == pool_state.lp_token_mint.key()
    )]
    pub lp_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = user_token_a.mint == pool_state.token_a_mint.key(),
        constraint = user_token_a.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_token_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_token_b.mint == pool_state.token_b_mint.key(),
        constraint = user_token_b.owner == user.key()
    )]
    /// the token account to withdraw from
    pub user_token_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.token_a_mint.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
        constraint = token_a_vault.key() == pool_state.token_a_vault.key()
    )]
    pub token_a_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, pool_state.token_b_mint.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump,
        constraint = token_b_vault.key() == pool_state.token_b_vault.key()
    )]
    pub token_b_vault: Box<Account<'info, TokenAccount>>,

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
    pub fn transfer_user_token_a_to_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!("Account balances before transfer...");
            msg!("user_token_a.amount: {}", self.user_token_a.amount);
            msg!("token_a_vault.amount: {}", self.token_a_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.user_token_a.to_account_info(),
            to: self.token_a_vault.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn transfer_user_token_b_to_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!("Account balances before transfer...");
            msg!("user_token_b.amount: {}", self.user_token_b.amount);
            msg!("token_b_vault.amount: {}", self.token_b_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.user_token_b.to_account_info(),
            to: self.token_b_vault.to_account_info(),
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
        token_a_amount: u64,
        token_b_amount: u64,
    ) -> Option<u64> {
        calculate_k(token_a_amount, token_b_amount, self.lp_token_mint.supply)
    }

    /// calculate a and b tokens (x/y) from expected_lp_tokens (k)
    pub fn calculate_a_and_b_tokens_to_debit_from_expected_lp_tokens(
        &self,
        expected_lp_tokens_minted: u64,
    ) -> (u64, u64) {
        calculate_x_y(
            expected_lp_tokens_minted,
            self.token_a_vault.amount,
            self.token_b_vault.amount,
            self.lp_token_mint.supply,
        )
    }
}

pub fn handle(
    ctx: Context<AddLiquidity>,
    token_a_max_amount: u64, // slippage handling: token_a_amount * (1 + TOLERATED_SLIPPAGE) --> calculated in UI
    token_b_max_amount: u64, // slippage handling: token_b_amount * (1 + TOLERATED_SLIPPAGE) --> calculated in UI
    expected_lp_tokens: u64, // not used for first deposit.
) -> ProgramResult {
    if ctx.accounts.pool_state.debug {
        msg!("expected_lp_tokens: {}", expected_lp_tokens);
        msg!("token_a_max_amount: {}", token_a_max_amount);
        msg!("token_b_max_amount: {}", token_b_max_amount);
    }

    let seeds = &[
        POOL_STATE_SEED,
        ctx.accounts.pool_state.lp_token_mint.as_ref(),
        &[ctx.accounts.pool_state.pool_state_bump],
    ];
    let signer = [&seeds[..]];

    let (token_a_to_debit, token_b_to_debit, lp_tokens_to_mint);

    // On first deposit
    if let Some(lp_tokens) = ctx
        .accounts
        .calculate_first_deposit_lp_tokens_to_mint(token_a_max_amount, token_b_max_amount)
    {
        // mint and lock lp tokens on first deposit
        let mut cpi_tx = ctx.accounts.mint_and_lock_lp_tokens_to_pool_state_account();
        cpi_tx.signer_seeds = &signer;
        token::mint_to(cpi_tx, MIN_LIQUIDITY)?;

        if ctx.accounts.pool_state.debug {
            msg!("lp_tokens_locked: {}", MIN_LIQUIDITY);
        }

        token_a_to_debit = token_a_max_amount;
        token_b_to_debit = token_b_max_amount;
        lp_tokens_to_mint = lp_tokens;
    } else {
        // On subsequent deposits
        let debited = ctx
            .accounts
            .calculate_a_and_b_tokens_to_debit_from_expected_lp_tokens(expected_lp_tokens);

        token_a_to_debit = debited.0;
        token_b_to_debit = debited.1;
        lp_tokens_to_mint = expected_lp_tokens;

        if (token_a_to_debit > token_a_max_amount) || (token_b_to_debit > token_b_max_amount) {
            if ctx.accounts.pool_state.debug {
                msg!("Error: SlippageExceeded");
                msg!("token_a_to_debit: {}", token_a_to_debit);
                msg!("token_a_max_amount: {}", token_a_max_amount);
                msg!("token_b_to_debit: {}", token_b_to_debit);
                msg!("token_b_max_amount: {}", token_b_max_amount);
            }
            emit!(SlippageExceeded {
                token_a_to_debit,
                token_b_to_debit,
                token_a_max_amount,
                token_b_max_amount,
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

    // transfer user_token_a to vault
    token::transfer(
        ctx.accounts.transfer_user_token_a_to_vault(),
        token_a_to_debit,
    )?;

    // transfer user_token_b to vault
    token::transfer(
        ctx.accounts.transfer_user_token_b_to_vault(),
        token_b_to_debit,
    )?;

    emit!(LiquidityAdded {
        tokens_a_transferred: token_a_to_debit,
        tokens_b_transferred: token_b_to_debit,
        lp_tokens_minted: lp_tokens_to_mint,
    });

    if ctx.accounts.pool_state.debug {
        msg!("lp_tokens_minted: {}", lp_tokens_to_mint);
        msg!("tokens_a_transferred: {}", token_a_to_debit);
        msg!("tokens_b_transferred: {}", token_b_to_debit);
    }

    Ok(())
}
