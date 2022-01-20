use proto::{cl_pool::*};

fn main() {
    let sol = Token::new("SOL", 9) ;
    println!("{:?}", sol);
    
    let pool = Pool::new("SOL", 9, "USDC",6,
    140f64.sqrt(), 1, 0.0, 0.0) ;
    println!("{:?}", pool);

    let rez = Pool::liq_x_only(2.0, 2000f64.sqrt(), 2500f64.sqrt());
    println!("{}", rez);
}
