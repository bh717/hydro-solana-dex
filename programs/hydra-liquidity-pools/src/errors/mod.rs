use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Slippage Amount Exceeded")]
    SlippageExceeded,

    #[msg("Invalid vault to SwapResult amounts")]
    InvalidVaultToSwapResultAmounts,

    #[msg("Mint address provided doesn't match pools")]
    InvalidMintAddress,
}
