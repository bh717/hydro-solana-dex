use hydra_math_rs::decimal::*;
// use hydra_proto::cl_pool_float::*;

fn main() {
    // println!("{}", u128::MAX);
    // println!("{}", u32::MAX);
    // println!("{}", f64::MAX.log(1.0001_f64.sqrt()));
    // println!("{}", (u128::MAX as f64).log(1.0001_f64.sqrt()));

    // let pool = Pool::new("ETH", 18, "USDC", 6, 4000_f64.sqrt(), 100, 0.0, 0.0);
    // println!("{:#?}", pool);

    // println!("{}", 63.1045430018443_f64.powi(2));
    // println!("{}", pool.glbl_rp().powi(2));
    // println!("{}", Pool::tick_to_rp(pool.glbl_tick()).powi(2));

    let d1 = Decimal::new(4, 2, false);
    let d2 = Decimal::new(7, 2, false);
    let diff = d1.sub(d2).unwrap();
    println!("decimal diff {:?}", diff);
}
