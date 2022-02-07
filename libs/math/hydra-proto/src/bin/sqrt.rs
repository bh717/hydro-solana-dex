use hydra_math::math::sqrt_precise;
use spl_math::precise_number::PreciseNumber;

fn main() {
    println!("testing sqrt");

    println!(
        "precise: {:?}",
        sqrt_precise(&PreciseNumber::new(2).unwrap()).unwrap()
    );
    println!("float: {:?}", 2f64.sqrt());

    println!("u128::MAX precise: {:?}", std::u128::MAX);
    println!(
        "u128::MAX float: {:?}",
        sqrt_precise(&PreciseNumber::new(std::u128::MAX).unwrap()).unwrap()
    );
}
