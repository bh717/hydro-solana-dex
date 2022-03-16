//! Result storage

use crate::decimal::Decimal;

#[derive(Default, Debug)]
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

impl SwapResult {
    pub fn k(&self) -> u64 {
        self.k.into()
    }

    pub fn x_new(&self) -> u64 {
        self.x_new.into()
    }

    pub fn y_new(&self) -> u64 {
        self.y_new.into()
    }

    pub fn delta_x(&self) -> u64 {
        self.delta_x.into()
    }

    pub fn delta_y(&self) -> u64 {
        self.delta_y.into()
    }
}
