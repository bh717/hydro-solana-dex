use thiserror::Error;

#[derive(Error, Debug)]
pub enum SwapCalculatorError {
    #[error("Delta input provided was not positive or greater than zero")]
    DeltaNotPositive,
}
