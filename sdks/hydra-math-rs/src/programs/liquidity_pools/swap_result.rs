//! Result storage
// use wasm_bindgen::prelude::wasm_bindgen;

// #[wasm_bindgen]
// TODO: Binding wasm cause an ELF error when executed on chain! e.g.
//     ELF error: Found writable section (.bss._ZN12wasm_bindgen4__rt14GLOBAL_EXNDATA17h995437702f5c1196E) in ELF, read-write data not supported
#[derive(Default, Debug)]
/// Encodes all results of swapping from a source token to a destination token
pub struct SwapResult {
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

impl Into<Vec<u64>> for SwapResult {
    fn into(self) -> Vec<u64> {
        vec![
            self.x_new,
            self.y_new,
            self.delta_x,
            self.delta_y,
            self.fees,
        ]
    }
}

impl From<Vec<u64>> for SwapResult {
    fn from(vector: Vec<u64>) -> Self {
        SwapResult {
            x_new: vector[0],
            y_new: vector[1],
            delta_x: vector[2],
            delta_y: vector[3],
            fees: vector[4],
        }
    }
}
