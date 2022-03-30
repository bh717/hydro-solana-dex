use crate::state::pool_state::PoolState;
use crate::utils::pyth::PythErrors::{
    InvalidAccount, InvalidAccountType, InvalidAccountVersion, InvalidMagicNumber,
    InvalidPriceAccount, InvalidSettingsForAccount, PriceAccountMarkedInvalid,
};
use crate::Swap;
use anchor_lang::prelude::*;

const DELAY_TOLERANCE: u8 = 5;

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Debug)]
pub struct PythSettings {
    pub pyth_product_account: Pubkey,
    pub pyth_price_account: Pubkey,
    pub last_known_price: i64, // used to store the price as pyth can sometime return a None on: price_account.get_current_price() calls lacking enough valid publishes on a time slot.
    pub last_known_price_slot: u64, // TODO: will possible need this to check how long ago the last_known_price was valid
    pub price_exponent: u8,
}

impl PythSettings {
    pub fn update_price(&mut self, new_price: i64, valid_slot: u64) {
        self.last_known_price = new_price;
        self.last_known_price_slot = valid_slot;
    }
}

#[error_code]
pub enum PythErrors {
    #[msg("Pyth product account provided has an invalid MAGIC number")]
    InvalidMagicNumber,

    #[msg("Pyth product account is invalid")]
    InvalidAccount,

    #[msg("Pyth product account provided has an invalid account type")]
    InvalidAccountType,

    #[msg("Pyth product account provided has a different version than the Pyth client")]
    InvalidAccountVersion,

    #[msg("Pyth product price account is marked as invalid")]
    PriceAccountMarkedInvalid,

    #[msg("Pyth price account does not match the Pyth price account provided")]
    InvalidPriceAccount,

    #[msg("No pyth settings saved for account data")]
    InvalidSettingsForAccount,
}

/// This function checks that the pyth product and pyth price account are a match so one can't spoof the price account
/// and therefore trick the hmm price oracle algo
pub fn pyth_accounts_security_check(
    remaining_accounts: &[AccountInfo],
) -> Result<Option<PythSettings>> {
    // checks the options pyth product and price accounts [0,1] have been passed into the contract
    if remaining_accounts.len() == 2 {
        let remaining_accounts = remaining_accounts.to_vec();
        let pyth_product_account = &remaining_accounts[0];
        let pyth_price_account = &remaining_accounts[1];

        // load product account
        let pyth_product_data = &pyth_product_account.try_borrow_data()?;
        let product_account =
            pyth_client::load_product(pyth_product_data).map_err(|_| InvalidAccount)?;

        // validate product account checks

        // pyth product account magic number check
        if product_account.magic != pyth_client::MAGIC {
            return Err(InvalidMagicNumber.into());
        }

        // pyth product account type check
        if product_account.atype != pyth_client::AccountType::Product as u32 {
            return Err(InvalidAccountType.into());
        }

        // pyth product account version check
        if product_account.ver != pyth_client::VERSION_2 {
            return Err(InvalidAccountVersion.into());
        }

        if !product_account.px_acc.is_valid() {
            return Err(PriceAccountMarkedInvalid.into());
        }

        let pyth_price_pubkey = Pubkey::new(&product_account.px_acc.val);
        if &pyth_price_pubkey != pyth_price_account.key {
            return Err(InvalidPriceAccount.into());
        }

        let pyth_price_data = &pyth_price_account.try_borrow_data()?;
        let price_account = pyth_client::load_price(pyth_price_data).map_err(|_| InvalidAccount)?;

        msg!("Pyth: accounts detected");
        return Ok(Some(PythSettings {
            pyth_product_account: pyth_product_account.key(),
            pyth_price_account: pyth_price_account.key(),
            price_exponent: price_account.expo.unsigned_abs() as u8,
            last_known_price: price_account.agg.price,
            last_known_price_slot: price_account.valid_slot,
        }));
    }
    msg!("Pyth: no accounts detected");
    Ok(None)
}

/// This function checks for a given price account matches the saved key in the pool_state.pyth onchain object for a swap instruction
pub fn pyth_price_account_security_check(ctx: &Context<Swap>) -> Result<()> {
    // price account is the only optional account required for a swap to then be a hmm swap.
    if ctx.remaining_accounts.len() == 1 {
        // first check we have settings saved for pyth/hmm
        if let Some(pyth_settings) = &ctx.accounts.pool_state.pyth {
            let possible_price_account = &ctx.remaining_accounts[0];
            // then check account against saved key settings
            if pyth_settings.pyth_price_account == possible_price_account.key() {
                msg!("Oracle: Valid Price account detected");
                return Ok(());
            } else {
                return Err(InvalidPriceAccount.into());
            }
        } else {
            return Err(InvalidSettingsForAccount.into());
        }
    }
    // No optional accounts passed into contract. Swap will be cpmm.
    Ok(())
}

/// Get and update last known price will fetch a price from the Oracle if the feeds are returning as valid. For a valid fetch the price is also saved as last_known_price.
/// For an invalid feed the last_known_price is returned. Where no oracle is enabled on a pool a None is returned.  
pub fn get_and_update_last_known_price(
    pyth_price_account: &AccountInfo,
    pool_state: &mut PoolState,
) -> Option<u64> {
    let price_account_data = &pyth_price_account.try_borrow_data().ok()?;
    let price_account = pyth_client::load_price(price_account_data).ok()?;

    // Get a valid price from pyth price contracts if feed is considered live
    if let Some(p) = price_account.get_current_price() {
        pool_state.update_oracle_price(p.price, price_account.valid_slot);
        msg!("Oracle Price: {}", p.price);
        msg!("Valid slot: {}", price_account.valid_slot);
        return Some(p.price as u64);
    }

    // Otherwise get price from last_known_price
    if let Some(p) = &pool_state.pyth {
        let current = Clock::get().ok()?;
        let diff: i64 = (current.slot as i64)
            .checked_sub(p.last_known_price_slot as i64)
            .unwrap()
            .checked_abs()
            .unwrap();

        if diff <= DELAY_TOLERANCE as i64 {
            msg!("last_known_price: {}", p.last_known_price as u64);
            msg!("last_known_price_slot: {}", p.last_known_price_slot);
            return Some(p.last_known_price as u64);
        }
    }

    // Otherwise, no Oracle enabled on pool
    msg!("Oracle: no live or last_known_price available");
    None
}
