use proto::{cl_pool::*};

fn main() {
    // let sol = Token::new("SOL", 9) ;
    // println!("{:?}", sol);
    
    // let pool = Pool::new("SOL", 9, "USDC",6,
    // 140f64.sqrt(), 1, 0.0, 0.0) ;
    // println!("{:?}", pool);

    // let rez = Pool::liq_x_only(2.0, 2000f64.sqrt(), 2500f64.sqrt());
    // println!("{}", rez);
    // println!("{}", u128::MAX);
    // println!("{}", u32::MAX);
    // println!("{}", f64::MAX.log(1.0001_f64.sqrt()));
    // println!("{}", (u128::MAX as f64).log(1.0001_f64.sqrt()));

    let mut pool = Pool::new("ETH", 18, "USDC",6,
    4000_f64.sqrt(), 100, 0.0, 0.0) ;
    println!("{:?}", pool);

    println!("{}", 63.1045430018443_f64.powi(2));
    println!("{}", pool.glbl_rp().powi(2));
    println!("{}", Pool::tick_to_rp(pool.glbl_tick()).powi(2));

}
