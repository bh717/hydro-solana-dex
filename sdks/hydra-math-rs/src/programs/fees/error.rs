use thiserror::Error;

#[derive(Error, Debug)]
pub enum FeeCalculatorError {
    #[error("Fees are greater than input amount")]
    FeesGreaterThanAmount,
}
