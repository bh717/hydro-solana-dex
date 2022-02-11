use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Number conversion Failure")]
    NumberConversionFailure,

    #[msg("Slippage Amount Exceeded")]
    SlippageExceeded,

    #[msg("Checked Maths Error")]
    CheckedMathsError,

    #[msg("Deposit tokens not in the correct ratio")]
    DepositRatioIncorrect,

    #[msg("Pool Already initialized")]
    PoolAlreadyInitialized,
}
