use crate::utils::pyth::PythErrors::{
    InvalidAccountType, InvalidAccountVersion, InvalidMagicNumber, InvalidPriceAccount,
    PriceAccountMarkedInvalid,
};
use crate::Initialize;
use anchor_lang::prelude::*;

#[error_code]
pub enum PythErrors {
    #[msg("Pyth product account provided has an invalid MAGIC number")]
    InvalidMagicNumber,

    #[msg("Pyth product account provided has an invalid account type")]
    InvalidAccountType,

    #[msg("Pyth product account provided has a different version than the Pyth client")]
    InvalidAccountVersion,

    #[msg("Pyth product price account is marked as invalid")]
    PriceAccountMarkedInvalid,

    #[msg("Pyth product price account does not match the Pyth price account provided")]
    InvalidPriceAccount,
}

/// This function checks that the pyth product and pyth price account are a match so one can't spoof the price account
/// and therefore trick the hmm price oracle input.
pub fn pyth_account_security_check(ctx: &Context<Initialize>) -> Result<()> {
    // checks the options pyth product and price accounts [0,1] have been passed into the contract
    if ctx.remaining_accounts.len() == 2 {
        let remaining_accounts = ctx.remaining_accounts.to_vec();
        let pyth_product_account = &remaining_accounts[0];
        let pyth_price_account = &remaining_accounts[1];

        // load product account
        let pyth_product_info = pyth_product_account;
        let pyth_product_data = &pyth_product_info.try_borrow_data()?;
        let product_account = *pyth_client::load_product(pyth_product_data).unwrap();

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
    }
    Ok(())
}
