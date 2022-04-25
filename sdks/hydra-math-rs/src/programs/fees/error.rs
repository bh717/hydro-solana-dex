use crate::decimal::DecimalError;
use crate::programs::fees::fee_result::FeeResultBuilderError;
use thiserror::Error;

/// Error codes related to [FeeCalculator].
#[derive(Error, Debug)]
pub enum FeeCalculatorError {
    #[error("Fees are greater than input amount")]
    FeesGreaterThanAmount,
    #[error(transparent)]
    DecimalError(#[from] DecimalError),
    #[error(transparent)]
    FeeResultBuilderError(#[from] FeeResultBuilderError),
}
