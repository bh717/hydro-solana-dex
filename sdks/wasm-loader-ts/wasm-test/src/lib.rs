use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: u64, b: u64) -> u64 {
    a + b
}

#[wasm_bindgen]
pub fn div(a: u64, b: u64) -> Result<u64, String> {
    a.checked_div(b)
        .ok_or_else(|| String::from("Divide by zero"))
}

#[wasm_bindgen]
pub fn check_string_err(a: u64) -> Result<u64, String> {
    if a > 10 {
        return Err(String::from("Answer is greater than 10!"));
    }

    Ok(a)
}

#[wasm_bindgen]
pub fn only_even(a: u64) -> Option<u64> {
    if a % 2 == 0 {
        return Some(a);
    }
    None
}

#[wasm_bindgen]
pub struct ReturnXY {
    pub x: u64,
    pub y: u64,
}

#[wasm_bindgen]
pub fn returning_struct(a: u64) -> Result<ReturnXY, String> {
    if a % 2 == 1 {
        return Err(String::from("You passed in an odd number!"));
    }
    Ok(ReturnXY { x: a, y: a })
}

#[wasm_bindgen]
pub fn returning_vec(a: u64) -> Result<Vec<u64>, String> {
    if a % 2 == 1 {
        return Err(String::from("You passed in an odd number!"));
    }
    let v = vec![1, 2, 3];
    Ok(v)
}

#[wasm_bindgen]
pub fn yikes() {
    panic!("Holy taco!");
}
