use thiserror::Error;

#[derive(Error, Debug)]
pub enum FeeCalculatorError {
    #[error("Fees are greater than input amount")]
    FeesGreaterThanAmount,
    #[error("Failed to build struct due to input provided")]
    BuilderIncomplete,
}
