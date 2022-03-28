//! Result storage

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Default, Debug)]
/// Encodes all results of swapping from a source token to a destination token
pub struct SwapResult {
    /// Invariant expressed as k
    pub k: u64,
    /// squared_k is the k version used to calculate the lp tokens
    pub squared_k: u64,
    /// New base token amount expressed as x_new
    pub x_new: u64,
    /// New quote token amount expressed as y_new
    pub y_new: u64,
    /// Amount of base token swapped expressed as delta_x
    pub delta_x: u64,
    /// Amount of quote token swapped expressed as delta_x
    pub delta_y: u64,
    /// Amount of fees deducted from source token before operation
    pub fees: u64,
}
