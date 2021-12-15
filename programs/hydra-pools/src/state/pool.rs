use anchor_lang::prelude::*;

#[account(zero_copy)]
pub struct Pool {
    // version of formulas used in this Pool
    pub version: u32,

    // The currency used for quote prices
    pub quote_currency: [u8; 15],

    /// The bump seed value for generating the authority address.
    pub authority_bump_seed: [u8; 1],

    /// The address used as the seed for generating the market authority
    /// address. Typically this is the market account's own address.
    pub authority_seed: Pubkey,

    // The account derived by the program, which has authority over all asserts in the Pool
    pub pool_authority: Pubkey,

    /// The account that has authority to make changes to the market
    pub owner: Pubkey,

    /// The mint for the token used to quote the value for reserve assets.
    pub quote_token_mint: Pubkey,
}
