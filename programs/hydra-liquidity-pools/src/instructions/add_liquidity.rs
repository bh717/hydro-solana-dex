use crate::constants::*;
use crate::state::pool_state::PoolState;
use crate::ProgramResult;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{burn, Mint, MintTo, Token, TokenAccount};
use crate::events::lp_tokens_issued::LpTokensIssued;

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

impl<'info> AddLiquidity<'info> {

    /// AddLiquidity instruction. See python model here: https://colab.research.google.com/drive/1p0HToo1mxm2Z1e8dpzIvScGrMCrgN6qr?authuser=2#scrollTo=Awc9KZdYEpPn
    pub fn calculate_lp_tokens_to_issue(&self, token_a_amount: u64, token_b_amount: u64) -> Result<u64, ProgramError> {
        let x = token_a_amount;
        let y = token_b_amount;

        let mut x_total = self.pool_state.x_total;
        let mut y_total = self.pool_state.y_total;
        let lp_total = self.lp_token_mint.supply;
        let mut burn_lp: u64 = 0;
        let mut lp_tokens_to_issue: u64 = 0;

        if x_total == 0 {
            burn_lp = 10_u64.pow(3);
            // lp_tokens_to_issue = (x / y).pow(0.5 as u32) - burn_lp;

            lp_tokens_to_issue = x.checked_div(y)
                .unwrap()
                .pow(0.5 as u32)
                .checked_sub(burn_lp)
                .unwrap()


        } else {
            if x / y != x_total / y_total {
                return Err(ProgramError::Custom(99))
            }
            lp_tokens_to_issue = (x / x_total) * lp_total;
        }

        x_total += x;
        y_total += y;

        msg!("lp_tokens_to_issue: {}", lp_tokens_to_issue);
        Ok(lp_tokens_to_issue)
    }

    pub fn into_mint_lp_token(&self) -> CpiContext<'_,'_,'_, 'info, MintTo<'info>> {
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
) -> ProgramResult {
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

    let lp_tokens_to_issue = ctx.accounts.calculate_lp_tokens_to_issue(token_a_amount, token_b_amount)?;
    token::mint_to(cpi_tx, lp_tokens_to_issue)?;

    msg!("lp_tokens_issued: {}", lp_tokens_to_issue);
    emit!(LpTokensIssued{
       amount: lp_tokens_to_issue,
    });




    Ok(())
}

