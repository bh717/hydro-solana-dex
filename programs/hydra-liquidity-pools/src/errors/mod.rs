use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Slippage Amount Exceeded")]
    SlippageExceeded,

    #[msg("Invalid Compensation Parameter")]
    InvalidCompensationParameter,
}
