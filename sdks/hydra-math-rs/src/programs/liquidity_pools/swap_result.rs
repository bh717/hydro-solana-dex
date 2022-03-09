//! Result storage

use crate::decimal::Decimal;

#[derive(Debug)]
/// Encodes all results of swapping from a source token to a destination token
pub struct SwapResult {
    /// Invariant expressed as k
    pub k: Decimal,
    /// New source amount expressed as x_new
    pub x_new: Decimal,
    /// New destination amount expressed as y_new
    pub y_new: Decimal,
    /// Amount of source token swapped expressed as delta_x
    pub delta_x: Decimal,
    /// Amount of destination token swapped expressed as delta_x
    pub delta_y: Decimal,
}
