pub mod cl_pool;

#[cfg(test)]
mod tests {

    use crate::cl_pool::*;
    
    #[test]
    fn problem1() {
        // A user has x = 2 ETH and wants to set up a liquidity position in an ETH/USDC pool. 
        // The current price of ETH is P =2000 USDC and target price range is from pa = 1500 to
        // pb = 2500 USDC. How much USDC (y) do they need?
        let (pa,p,pb) = (1500f64,2000f64,2500f64);
        let lx = Pool::liq_x_only(2.0,p.sqrt(), pb.sqrt());
        assert_eq!(lx, 847.2135954999583);

        let y = Pool::y_from_l_rp_rng(lx, p.sqrt(), pa.sqrt(), pb.sqrt());
        assert_eq!(y, 5076.102359479882);
    }

    #[test]
    fn problem2() {
        // A user has x=2 ETH and y=4000 USDC, and wants to use pb =3000USDC perETH as the top of 
        // the price range. What is the bottom of the range (pa) that ensures the opened position 
        // uses the full amount of their funds?
        let (x,y) = (2_f64,4000_f64);
        let p = y/x;
        let pb = 3000f64;

        let rpa = Pool::rpa_from_x_y_rp_rpb(x, y, p.sqrt(), pb.sqrt());
        assert_eq!(rpa.powi(2), 1333.3333333333333);

        let lx = Pool::liq_x_only(2.0,p.sqrt(), pb.sqrt());
        let rpa_bis = Pool::rpa_from_l_rp_y(lx, p.sqrt(), y);
        assert_eq!(rpa_bis.powi(2), 1333.3333333333337);
    }
}
