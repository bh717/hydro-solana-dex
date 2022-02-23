use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Slippage Amount Exceeded")]
    SlippageExceeded,
}
