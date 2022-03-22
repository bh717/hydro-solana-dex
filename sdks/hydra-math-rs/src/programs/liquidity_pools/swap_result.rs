//! Result storage

use crate::decimal::Decimal;

#[derive(Default, Debug)]
/// Encodes all results of swapping from a source token to a destination token
pub struct SwapResult {
    /// Invariant expressed as k
    pub k: Decimal,
    /// squared_k is the k version used to calculate the lp tokens
    pub squared_k: Decimal,
    /// New base token amount expressed as x_new
    pub x_new: Decimal,
    /// New quote token amount expressed as y_new
    pub y_new: Decimal,
    /// Amount of base token swapped expressed as delta_x
    pub delta_x: Decimal,
    /// Amount of quote token swapped expressed as delta_x
    pub delta_y: Decimal,
    /// Amount of fees deducted from source token before operation
    pub fees: Decimal,
}

impl SwapResult {
    pub fn x_new_down(&self) -> u64 {
        self.x_new.to_scale(0).try_into().unwrap()
    }

    pub fn x_new_up(&self) -> u64 {
        self.x_new.to_scale_up(0).try_into().unwrap()
    }

    pub fn y_new_down(&self) -> u64 {
        self.y_new.to_scale(0).try_into().unwrap()
    }

    pub fn y_new_up(&self) -> u64 {
        self.y_new.to_scale_up(0).try_into().unwrap()
    }

    pub fn delta_x_down(&self) -> u64 {
        self.delta_x.to_scale(0).try_into().unwrap()
    }

    pub fn delta_y_down(&self) -> u64 {
        self.delta_y.to_scale(0).try_into().unwrap()
    }

    pub fn squared_k_up(&self) -> u64 {
        self.squared_k.to_scale_up(0).try_into().unwrap()
    }

    pub fn squared_k_down(&self) -> u64 {
        self.squared_k.to_scale(0).try_into().unwrap()
    }
}
