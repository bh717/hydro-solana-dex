use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg(NumberConcerionFailure)]
    NumberConversionFailure,

    #[msg(SlippageAmountExceeded)]
    SlippageExceeded,

    #[msg(CheckedMathsError)]
    CheckedMathsError,
}
