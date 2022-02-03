use crate::constants::*;
use crate::errors::ErrorCode;
use crate::events::lp_tokens_issued::LpTokensIssued;
use crate::state::pool_state::PoolState;
use crate::utils::{to_u128, to_u64};
use crate::ProgramResult;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{burn, Mint, MintTo, Token, TokenAccount, Transfer};
use hydra_math::math::sqrt_precise;
use spl_math::precise_number::PreciseNumber;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(
        seeds = [ POOL_STATE_SEED, token_a_mint.key().as_ref(), token_b_mint.key().as_ref(), lp_token_mint.key().as_ref() ],
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

const MIN_LIQUIDITY: u64 = 10_u64.pow(3);

impl<'info> AddLiquidity<'info> {
    pub fn into_transfer_user_token_a_to_vault(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
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

    pub fn into_transfer_user_token_b_to_vault(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
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
    pub fn calculate_lp_tokens_to_issue(
        &self,
        token_a_amount: u64,
        token_b_amount: u64,
    ) -> Result<u64, ProgramError> {
        let x = token_a_amount;
        let y = token_b_amount;
        let x_total = self.token_a_vault.amount;
        let y_total = self.token_b_vault.amount;
        let lp_total = self.lp_token_mint.supply;
        let mut lp_tokens_to_issue = PreciseNumber::new(0 as u128).unwrap();

        if self.pool_state.debug {
            msg!("MIN_LIQUIDITY: {}", to_u128(MIN_LIQUIDITY)?);
            msg!("x: {}", x);
            msg!("y: {}", y);
            msg!("x_total: {}", x_total);
            msg!("y_total: {}", y_total);
            msg!("lp_total: {}", lp_total);
        }

        if x_total == 0 || y_total == 0 {
            lp_tokens_to_issue = Self::lp_tokens_to_mint_first_deposit(x, y)?;
        } else {
            lp_tokens_to_issue =
                Self::lp_tokens_to_mint_following_deposits(x, y, x_total, y_total, lp_total)?;
        }

        msg!("lp_tokens_to_issue: {}", lp_tokens_to_issue.value);
        Ok(lp_tokens_to_issue.to_imprecise().unwrap() as u64)
    }

    fn check_deposit_ration_correct(
        x: &PreciseNumber,
        y: &PreciseNumber,
        x_total: &PreciseNumber,
        y_total: &PreciseNumber,
    ) -> bool {
        // TODO: Cant seam to workout the best appraoch for this function
        // (x / y) != (x_total / y_total)
        // let step1 = x.checked_div(y).unwrap();
        // let step2 = x_total.checked_div(y).unwrap();
        // let step3 = step1 != step2;

        // if self.pool_state.debug {
        //     msg!("step1: {}", step1);
        //     msg!("step2: {}", step2);
        //     msg!("step3: {}", step3);
        // }

        // if self.pool_state.debug {
        //     msg!("(x/y): {}", x / y);
        //     msg!("(x_total/y_total): {}", x_total / y_total)
        // }
        true
    }

    // TODO: 1. This function has rounding issues
    fn lp_tokens_to_mint_following_deposits(
        x: u64,
        y: u64,
        x_total: u64,
        y_total: u64,
        lp_total: u64,
    ) -> Result<PreciseNumber, ProgramError> {
        let x = PreciseNumber::new(x as u128).unwrap();
        let y = PreciseNumber::new(y as u128).unwrap();
        let x_total = PreciseNumber::new(x_total as u128).unwrap();
        let y_total = PreciseNumber::new(y_total as u128).unwrap();
        let lp_total = PreciseNumber::new(lp_total as u128).unwrap();

        if !Self::check_deposit_ration_correct(&x, &y, &x_total, &y_total) {
            return Err(ErrorCode::DepositRatioIncorrect.into());
        }
        // TODO rem?

        // // lp_tokens_to_issue = (x / x_total) * lp_total;
        Ok(x.checked_div(&x_total)
            .unwrap()
            .floor()
            .unwrap()
            .checked_mul(&lp_total)
            .unwrap())
    }

    // TODO: This function is also giving rounding issues
    fn lp_tokens_to_mint_first_deposit(x: u64, y: u64) -> Result<PreciseNumber, ProgramError> {
        let x = PreciseNumber::new(x as u128).unwrap();
        let y = PreciseNumber::new(y as u128).unwrap();
        let min_liquidity = PreciseNumber::new(MIN_LIQUIDITY as u128).unwrap();

        // sqrt(x * y) - 10^3
        Ok(sqrt_precise(&x.checked_mul(&y).unwrap())
            .unwrap()
            .checked_sub(&min_liquidity)
            .unwrap())
    }

    pub fn into_mint_lp_token(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.lp_token_mint.to_account_info(),
            to: self.lp_token_to.to_account_info(),
            authority: self.pool_state.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

pub fn handle(
    ctx: Context<AddLiquidity>,
    token_a_amount: u64,
    token_b_amount: u64,
    minimum_lp_tokens_requested_by_user: u64, // Slippage handling
) -> ProgramResult {
    if ctx.accounts.pool_state.debug {
        msg!("token_a_amount: {}", token_a_amount);
        msg!("token_b_amount: {}", token_b_amount);
        msg!(
            "minimum_lp_tokens_requested_by_user: {}",
            minimum_lp_tokens_requested_by_user
        );
    }

    let seeds = &[
        POOL_STATE_SEED,
        ctx.accounts.pool_state.token_a_mint.as_ref(),
        ctx.accounts.pool_state.token_b_mint.as_ref(),
        ctx.accounts.pool_state.lp_token_mint.as_ref(),
        &[ctx.accounts.pool_state.pool_state_bump],
    ];
    let signer = [&seeds[..]];

    let mut cpi_tx = ctx.accounts.into_mint_lp_token();
    cpi_tx.signer_seeds = &signer;

    let lp_tokens_to_issue = ctx
        .accounts
        .calculate_lp_tokens_to_issue(token_a_amount, token_b_amount)?;

    if !(lp_tokens_to_issue >= minimum_lp_tokens_requested_by_user) {
        // TODO emit event
        msg!("Error: SlippageExceeded");
        msg!(
            "minimum_lp_tokens_requested_by_user: {}",
            minimum_lp_tokens_requested_by_user
        );
        msg!("lp_tokens_to_issue: {}", lp_tokens_to_issue);
        return Err(ErrorCode::SlippageExceeded.into());
    }

    // mint lp tokens to users account
    token::mint_to(cpi_tx, lp_tokens_to_issue)?;

    if ctx.accounts.pool_state.debug {
        msg!("lp_tokens_issued: {}", lp_tokens_to_issue);
        emit!(LpTokensIssued {
            amount: lp_tokens_to_issue,
        });
    }

    // transfer user_token_a to vault
    token::transfer(
        ctx.accounts.into_transfer_user_token_a_to_vault(),
        token_a_amount,
    )?;

    // transfer user_token_b to vault
    token::transfer(
        ctx.accounts.into_transfer_user_token_b_to_vault(),
        token_b_amount,
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
}
