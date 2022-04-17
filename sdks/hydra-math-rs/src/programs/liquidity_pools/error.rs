use thiserror::Error;

#[derive(Error, Debug)]
pub enum SwapCalculatorError {
    #[error("Failed to build struct due to input provided")]
    BuilderIncomplete,
    #[error("Delta input provided was not positive or greater than zero")]
    DeltaNotPositive,
}
