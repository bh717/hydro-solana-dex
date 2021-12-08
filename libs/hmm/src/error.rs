//! Error types

use num_derive::FromPrimitive;
use solana_program::{decode_error::DecodeError, program_error::ProgramError};
use thiserror::Error;

/// Errors that may be returned by the math
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum MathError {
    /// Calculation overflowed
    #[error("Calculation overflowed")]
    Overflow,
    /// Calculation overflowed
    #[error("Calculation underflowed")]
    Underflow,
    /// Calculation failed conversion
    #[error("Calculation failed conversion")]
    ConversionFailure,
    /// Calculation failed
    #[error("Calculation failed")]
    CalculationFailure,
}

impl From<MathError> for ProgramError {
    fn from(e: MathError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for MathError {
    fn type_of() -> &'static str {
        "Math Error"
    }
}
