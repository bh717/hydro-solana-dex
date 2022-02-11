use crate::constants::*;
use crate::errors::ErrorCode;
use crate::events::lp_tokens_minted::LpTokensMinted;
use crate::state::pool_state::PoolState;
use crate::DEBUG_MODE;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, MintTo, Token, TokenAccount, Transfer};
use hydra_math::math::sqrt_precise;
use spl_math::precise_number::PreciseNumber;

#[derive(Accounts)]
#[instruction(token_a_vault_bump: u8, token_b_vault_bump: u8, pool_state_bump: u8)]
pub struct InitializeWithFirstDeposit<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub user_authority: Signer<'info>,

    #[account(
        init,
        payer = user_authority,
        seeds = [ POOL_STATE_SEED, lp_token_mint.key().as_ref() ],
        bump = pool_state_bump,
        rent_exempt = enforce,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    /// token_a_mint. Eg HYD
    pub token_a_mint: Box<Account<'info, Mint>>,

    // token_b_mint: Eg USDC
    pub token_b_mint: Box<Account<'info, Mint>>,

    #[account(
        constraint = lp_token_mint.mint_authority.unwrap() == pool_state.key()
    )]
    /// lp_token_mint: Eg xlp-hyd-usdc
    pub lp_token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = user_authority,
        token::mint = token_a_mint,
        token::authority = token_a_vault,
        seeds = [ TOKEN_VAULT_SEED, token_a_mint.key().as_ref(), pool_state.key().as_ref() , lp_token_mint.key().as_ref() ],
        bump = token_a_vault_bump,
        rent_exempt = enforce,
    )]
    pub token_a_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = user_authority,
        token::mint = token_b_mint,
        token::authority = token_b_vault,
        seeds = [ TOKEN_VAULT_SEED, token_b_mint.key().as_ref(), pool_state.key().as_ref(), lp_token_mint.key().as_ref() ],
        bump = token_b_vault_bump,
        rent_exempt = enforce,
    )]
    pub token_b_vault: Box<Account<'info, TokenAccount>>,

    // first deposit accounts needed.
    #[account(
        mut,
        constraint = user_token_a.mint == pool_state.token_a_mint.key(),
        constraint = user_token_a.owner == user_authority.key()
    )]
    /// user_token_a token account to withdraw from
    pub user_token_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_token_b.mint == pool_state.token_b_mint.key(),
        constraint = user_token_b.owner == user_authority.key()
    )]
    /// user_token_b token account to withdraw from
    pub user_token_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_lp_token_to_receive.mint == pool_state.lp_token_mint.key(),
    )]
    pub user_lp_token_to_receive: Box<Account<'info, TokenAccount>>,

    // system accounts
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitializeWithFirstDeposit<'info> {
    /// mint_and_lock_lp_tokens to pda
    pub fn mint_and_lock_lp_tokens(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.lp_token_mint.to_account_info(),
            to: self.pool_state.to_account_info(), // lock tokens in pool_state account
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    /// mint_lp_tokens to
    pub fn mint_lp_tokens(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.lp_token_mint.to_account_info(),
            to: self.user_lp_token_to_receive.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn transfer_user_token_a_to_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        if self.pool_state.debug {
            msg!("Account balances before transfer...");
            msg!("user_token_a.amount: {}", self.user_token_a.amount);
            msg!("token_a_vault.amount: {}", self.token_a_vault.amount);
        }

        let cpi_accounts = Transfer {
            from: self.user_token_a.to_account_info(),
            to: self.token_a_vault.to_account_info(),
            authority: self.user_authority.to_account_info(),
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
            authority: self.user_authority.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn calculate_lp_tokens_to_issue_for_first_deposit(
        &self,
        token_a_amount: u64,
        token_b_amount: u64,
    ) -> Result<u64, ProgramError> {
        let x = token_a_amount;
        let y = token_b_amount;
        let x_total = self.token_a_vault.amount;
        let y_total = self.token_b_vault.amount;
        let lp_total = self.lp_token_mint.supply;

        if self.pool_state.debug {
            msg!("MIN_LIQUIDITY: {}", MIN_LIQUIDITY);
            msg!("x: {}", x);
            msg!("y: {}", y);
            msg!("x_total: {}", x_total);
            msg!("y_total: {}", y_total);
            msg!("lp_total: {}", lp_total);
        }

        if lp_total == 0 {
            let x = PreciseNumber::new(x as u128).unwrap();
            let y = PreciseNumber::new(y as u128).unwrap();
            let min_liquidity = PreciseNumber::new(MIN_LIQUIDITY as u128).unwrap();

            // sqrt(x * y) - min_liquidity
            return Ok(sqrt_precise(&x.checked_mul(&y).unwrap())
                .unwrap()
                .checked_sub(&min_liquidity)
                .unwrap()
                .floor()
                .unwrap()
                .to_imprecise()
                .unwrap() as u64);
        }
        Err(ErrorCode::PoolAlreadyInitialized.into())
    }
}

pub fn handle(
    ctx: Context<InitializeWithFirstDeposit>,
    token_a_vault_bump: u8,
    token_b_vault_bump: u8,
    pool_state_bump: u8,
    token_a_amount: u64,
    token_b_amount: u64,
) -> ProgramResult {
    // save authority
    ctx.accounts.pool_state.authority = *ctx.accounts.authority.to_account_info().key;

    // save token_a_mint, token_b_mint and lp_token_mint
    ctx.accounts.pool_state.token_a_mint = *ctx.accounts.token_a_mint.to_account_info().key;
    ctx.accounts.pool_state.token_b_mint = *ctx.accounts.token_b_mint.to_account_info().key;
    ctx.accounts.pool_state.lp_token_mint = *ctx.accounts.lp_token_mint.to_account_info().key;

    // save token_a_vault and token_b_vault Pubkeys
    ctx.accounts.pool_state.token_a_vault = ctx.accounts.token_a_vault.to_account_info().key();
    ctx.accounts.pool_state.token_b_vault = ctx.accounts.token_b_vault.to_account_info().key();

    // save pool_state_bump, token_a_vault_bump and token_a_vault_bump
    ctx.accounts.pool_state.pool_state_bump = pool_state_bump;
    ctx.accounts.pool_state.token_a_vault_bump = token_a_vault_bump;
    ctx.accounts.pool_state.token_b_vault_bump = token_b_vault_bump;

    ctx.accounts.pool_state.debug = DEBUG_MODE;
    // pool_state is set

    if ctx.accounts.pool_state.debug {
        msg!("token_a_amount: {}", token_a_amount);
        msg!("token_b_amount: {}", token_b_amount);
    }

    let seeds = &[
        POOL_STATE_SEED,
        ctx.accounts.pool_state.lp_token_mint.as_ref(),
        &[ctx.accounts.pool_state.pool_state_bump],
    ];
    let signer = [&seeds[..]];

    let lp_tokens_to_mint = ctx
        .accounts
        .calculate_lp_tokens_to_issue_for_first_deposit(token_a_amount, token_b_amount)?;

    if ctx.accounts.pool_state.debug {
        msg!("lp_tokens_to_mint: {}", lp_tokens_to_mint);
    }

    // mint and lock tokens to pool_state pda
    let mut cpi_tx = ctx.accounts.mint_and_lock_lp_tokens();
    cpi_tx.signer_seeds = &signer;
    token::mint_to(cpi_tx, MIN_LIQUIDITY)?;

    // mint lp tokens to users account
    let mut cpi_tx = ctx.accounts.mint_lp_tokens();
    cpi_tx.signer_seeds = &signer;
    token::mint_to(cpi_tx, lp_tokens_to_mint)?;
    emit!(LpTokensMinted {
        amount: lp_tokens_to_mint,
    });

    // transfer user_token_a to vault
    token::transfer(
        ctx.accounts.transfer_user_token_a_to_vault(),
        token_a_amount,
    )?;

    // transfer user_token_b to vault
    token::transfer(
        ctx.accounts.transfer_user_token_b_to_vault(),
        token_b_amount,
    )?;

    Ok(())
}
