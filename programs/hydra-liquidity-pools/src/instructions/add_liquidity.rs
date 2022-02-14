use crate::constants::*;
use crate::errors::ErrorCode;
use crate::events::deposit_ratio_incorrect::DepositRatioIncorrect;
use crate::events::lp_tokens_minted::LpTokensMinted;
use crate::events::slippage_exceeded::SlippageExceeded;
use crate::state::pool_state::PoolState;
use crate::ProgramResult;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, MintTo, Token, TokenAccount, Transfer};
use hydra_math::math::sqrt_precise;
use spl_math::precise_number::PreciseNumber;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(
        seeds = [ POOL_STATE_SEED, lp_token_mint.key().as_ref() ],
        bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

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
        constraint = user_token_a.owner == user_authority.key()
    )]
    /// the token account to withdraw from
    pub user_token_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = user_token_b.mint == pool_state.token_b_mint.key(),
        constraint = user_token_b.owner == user_authority.key()
    )]
    /// the token account to withdraw from
    pub user_token_b: Box<Account<'info, TokenAccount>>,

    /// the authority allowed to transfer token_a and token_b from the users wallet.
    pub user_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, token_a_mint.key().as_ref(), pool_state.key().as_ref() , lp_token_mint.key().as_ref() ],
        bump,
        constraint = token_a_vault.key() == pool_state.token_a_vault.key()
    )]
    pub token_a_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, token_b_mint.key().as_ref(), pool_state.key().as_ref() , lp_token_mint.key().as_ref() ],
        bump,
        constraint = token_b_vault.key() == pool_state.token_b_vault.key()
    )]
    pub token_b_vault: Box<Account<'info, TokenAccount>>,

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

    /// AddLiquidity instruction. See python model here: https://colab.research.google.com/drive/1p0HToo1mxm2Z1e8dpzIvScGrMCrgN6qr?authuser=2#scrollTo=Awc9KZdYEpPn
    pub fn calculate_first_deposit_lp_tokens_to_mint(
        &self,
        token_a_amount: u64,
        token_b_amount: u64,
    ) -> Option<u64> {
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
            // After the guard due to compute cost.
            let x = PreciseNumber::new(x as u128).unwrap();
            let y = PreciseNumber::new(y as u128).unwrap();
            let min_liquidity = PreciseNumber::new(MIN_LIQUIDITY as u128).unwrap();

            // sqrt(x * y) - min_liquidity
            return Some(
                sqrt_precise(&x.checked_mul(&y).unwrap())
                    .unwrap()
                    .checked_sub(&min_liquidity)
                    .unwrap()
                    .floor()
                    .unwrap()
                    .to_imprecise()
                    .unwrap() as u64,
            );
        }
        None
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
            to: self.pool_state.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    // calculate a and b tokens (x/y) from expected_lp_tokens (k)
    pub fn calculate_a_and_b_tokens_to_debit_from_expected_lp_tokens(
        &self,
        expected_lp_tokens_minted: u64,
    ) -> (u64, u64) {
        let x_total = PreciseNumber::new(self.token_a_vault.amount as u128).unwrap();
        let y_total = PreciseNumber::new(self.token_b_vault.amount as u128).unwrap();
        let lp_total = PreciseNumber::new(self.lp_token_mint.supply as u128).unwrap();
        let expected_lp_tokens_minted =
            PreciseNumber::new(expected_lp_tokens_minted as u128).unwrap();

        let x_debited = expected_lp_tokens_minted
            .checked_mul(&x_total)
            .unwrap()
            .checked_div(&lp_total)
            .unwrap()
            .ceiling()
            .unwrap();
        let x_debited = x_debited.to_imprecise().unwrap() as u64;

        let y_debited = expected_lp_tokens_minted
            .checked_mul(&y_total)
            .unwrap()
            .checked_div(&lp_total)
            .unwrap()
            .ceiling()
            .unwrap();
        let y_debited = y_debited.to_imprecise().unwrap() as u64;

        //* note that we rounded up with .ceiling() (as we are receiving these amounts)
        (x_debited, y_debited)
    }
}

pub fn handle(
    ctx: Context<AddLiquidity>,
    expected_lp_issued: u64,
    tokens_a_max_amount: u64, // slippage handling: token_a_amount * (1 + TOLERATED_SLIPPAGE) --> calculated in UI
    tokens_b_max_amount: u64, // slippage handling: token_b_amount * (1 + TOLERATED_SLIPPAGE) --> calculated in UI
) -> ProgramResult {
    if ctx.accounts.pool_state.debug {
        msg!("expected_lp_issued: {}", expected_lp_issued);
        msg!("tokens_a_max_amount: {}", tokens_a_max_amount);
        msg!("tokens_b_max_amount: {}", tokens_b_max_amount);
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
        .calculate_first_deposit_lp_tokens_to_mint(tokens_a_max_amount, tokens_b_max_amount)
    {
        // mint and lock lp tokens on first deposit
        let mut cpi_tx = ctx.accounts.mint_and_lock_lp_tokens_to_pool_state_account();
        cpi_tx.signer_seeds = &signer;
        token::mint_to(cpi_tx, MIN_LIQUIDITY);

        emit!(LpTokensMinted {
            amount: MIN_LIQUIDITY,
        });

        if ctx.accounts.pool_state.debug {
            msg!("lp_tokens_locked: {}", MIN_LIQUIDITY);
        }

        token_a_to_debit = tokens_a_max_amount;
        token_b_to_debit = tokens_b_max_amount;
        lp_tokens_to_mint = lp_tokens;
    } else {
        // On subsequent deposits
        let (token_a_to_debit, token_b_to_debit) = ctx
            .accounts
            .calculate_a_and_b_tokens_to_debit_from_expected_lp_tokens(expected_lp_issued);
        lp_tokens_to_mint = expected_lp_issued;
    }

    // mint lp tokens to users account
    let mut cpi_tx = ctx.accounts.mint_lp_tokens_to_user_account();
    cpi_tx.signer_seeds = &signer;
    token::mint_to(cpi_tx, lp_tokens_to_mint)?;

    emit!(LpTokensMinted {
        amount: lp_tokens_to_mint,
    });

    if ctx.accounts.pool_state.debug {
        msg!("lp_tokens_to_mint: {}", lp_tokens_to_mint);
    }

    // transfer user_token_a to vault
    token::transfer(
        ctx.accounts.transfer_user_token_a_to_vault(),
        tokens_a_max_amount,
    )?;

    // transfer user_token_b to vault
    token::transfer(
        ctx.accounts.transfer_user_token_b_to_vault(),
        tokens_b_max_amount,
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
}
