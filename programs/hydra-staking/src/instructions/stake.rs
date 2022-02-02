use crate::constants::*;
use crate::events::*;
use crate::state::pool_state::PoolState;
use crate::utils::price::calculate_price;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, MintTo, Token, TokenAccount, Transfer};
use spl_math::precise_number::PreciseNumber;

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        seeds = [ POOL_STATE_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
        bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    #[account(
        constraint = token_mint.key() == pool_state.token_mint.key()
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = redeemable_mint.key() == pool_state.redeemable_mint.key()
    )]
    pub redeemable_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        constraint = user_from.mint == pool_state.token_mint.key(),
        constraint = user_from.owner == user_from_authority.key()
    )]
    /// the token account to withdraw from
    pub user_from: Box<Account<'info, TokenAccount>>,

    /// the authority allowed to transfer from token_from
    pub user_from_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ TOKEN_VAULT_SEED, token_mint.key().as_ref(), redeemable_mint.key().as_ref() ],
        bump,
        constraint = token_vault.key() == pool_state.token_vault.key()
    )]
    pub token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = redeemable_to.mint == pool_state.redeemable_mint.key(),
    )]
    pub redeemable_to: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Stake<'info> {
    pub fn calculate_price(&self) -> u64 {
        calculate_price(&self.token_vault, &self.redeemable_mint, &self.pool_state)
    }

    pub fn into_mint_redeemable(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.redeemable_mint.to_account_info(),
            to: self.redeemable_to.to_account_info(),
            authority: self.token_vault.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    pub fn into_transfer_from_user_to_token_vault(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_from.to_account_info(),
            to: self.token_vault.to_account_info(),
            authority: self.user_from_authority.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

pub fn handle(ctx: Context<Stake>, amount: u64) -> ProgramResult {
    let total_token_vault = ctx.accounts.token_vault.amount;
    let total_redeemable_tokens = ctx.accounts.redeemable_mint.supply;

    let old_price = ctx.accounts.calculate_price();
    msg!("old_price: {}", old_price);

    let token_mint_key = ctx.accounts.pool_state.token_mint.key();
    let redeemable_mint_key = ctx.accounts.pool_state.redeemable_mint.key();

    let seeds = &[
        TOKEN_VAULT_SEED,
        token_mint_key.as_ref(),
        redeemable_mint_key.as_ref(),
        &[ctx.accounts.pool_state.token_vault_bump],
    ];
    let signer = [&seeds[..]];

    // // On first stake.
    if total_token_vault == 0 || total_redeemable_tokens == 0 {
        let mut cpi_tx = ctx.accounts.into_mint_redeemable();
        cpi_tx.signer_seeds = &signer;
        token::mint_to(cpi_tx, amount)?;
    } else {
        // (amount * total_x_token.supply) / total_token_vault
        let mint_redeemable_amount: u64 =
            mint_redeemable_amount(amount, total_token_vault, total_redeemable_tokens);

        let mut cpi_tx = ctx.accounts.into_mint_redeemable();
        cpi_tx.signer_seeds = &signer;
        token::mint_to(cpi_tx, mint_redeemable_amount)?;
    }

    // transfer the users token's to the vault
    token::transfer(
        ctx.accounts.into_transfer_from_user_to_token_vault(),
        amount,
    )?;

    (&mut ctx.accounts.token_vault).reload()?;
    (&mut ctx.accounts.redeemable_mint).reload()?;

    let new_price = ctx.accounts.calculate_price();

    msg!("new_price: {}", new_price);
    emit!(PriceChange {
        old_base_per_quote_native: old_price,
        new_base_per_quote_native: new_price,
    });

    Ok(())
}

pub fn mint_redeemable_amount(
    amount: u64,
    total_token_vault: u64,
    total_redeemable_tokens: u64,
) -> u64 {
    let amount = PreciseNumber::new(amount as u128).unwrap();
    let total_token_vault = PreciseNumber::new(total_token_vault as u128).unwrap();
    let total_redeemable_tokens = PreciseNumber::new(total_redeemable_tokens as u128).unwrap();

    (amount)
        .checked_mul(&total_redeemable_tokens)
        .unwrap()
        .checked_div(&total_token_vault)
        .unwrap()
        .floor()
        .unwrap()
        .to_imprecise()
        .unwrap() as u64
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn check_mint_redeemable_amount() {
        // (amount * total_x_token.supply) / total_token_vault

        // With integer results
        let amount = 1_000u64;
        let total_redeemable_tokens = 100_000_000u64;
        let total_token_vault = 100_000_000u64;

        // (1000 * 100000000) / 100000000 = 1000
        let expected = 1000u64;

        let result = mint_redeemable_amount(amount, total_token_vault, total_redeemable_tokens);
        assert_eq!(
            expected, result,
            "redeemable (1000 * 100000000) / 100000000 = ({} * {} / {})",
            amount, total_redeemable_tokens, total_token_vault
        );

        // Expect fractional component to be rounded down (floored)
        let amount = 987u64;
        let total_redeemable_tokens = 99_99_000u64;
        let total_token_vault = 100_000_000u64;

        // (987 * 9999000) / 100000000 = 98.69013000000 = 98
        let expected = 98u64;

        let result = mint_redeemable_amount(amount, total_token_vault, total_redeemable_tokens);
        assert_eq!(
            expected, result,
            "redeemable (987 * 9999000) / 100000000 = ({} * {} / {})",
            amount, total_redeemable_tokens, total_token_vault
        );
    }

    pub struct StakePool {
        pub total_token_vault: u64,
        pub total_redeemable_tokens: u64,
    }

    prop_compose! {
        fn total_tokens_and_deposit()(total_token_vault in 1..u64::MAX)(
            total_token_vault in Just(total_token_vault),
            total_redeemable_tokens in 1..=total_token_vault,
            deposit_amount in 1..total_token_vault,
        ) -> (u64, u64, u64) {
            (
                total_token_vault - deposit_amount,
                total_redeemable_tokens.saturating_sub(deposit_amount).max(1),
                deposit_amount
            )
        }
    }

    proptest! {
        #[test]
        fn deposit_and_withdraw(
            (total_token_vault, total_redeemable_tokens, deposit_amount) in total_tokens_and_deposit()
        ) {
            let mut stake_pool = StakePool {
                total_token_vault,
                total_redeemable_tokens,
            };
            let deposit_result = mint_redeemable_amount(deposit_amount, total_token_vault, total_redeemable_tokens);
            prop_assume!(deposit_result > 0);
            stake_pool.total_token_vault += deposit_amount;
            stake_pool.total_redeemable_tokens += deposit_result;
            // TODO: move this prop test to utils/ path and add testing of withdrawls i.e. Unstake#token_share
            // let withdraw_result = token_share(amount, total_tokens, total_redeemable_token_supply);
            // assert!(withdraw_result <= deposit_stake);
        }
    }
}
