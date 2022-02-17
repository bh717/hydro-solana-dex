use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: u64, b: u64) -> u64 {
    return a + b;
}
