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

        //method 1
        let rpa = Pool::rpa_from_x_y_rp_rpb(x, y, p.sqrt(), pb.sqrt());
        assert_eq!(rpa.powi(2), 1333.3333333333333);

        // method 2
        let lx = Pool::liq_x_only(2.0,p.sqrt(), pb.sqrt());
        let rpa_bis = Pool::rpa_from_l_rp_y(lx, p.sqrt(), y);
        assert_eq!(rpa_bis.powi(2), 1333.3333333333337);
    }

    #[test]
    fn problem3() {
        // Using the liquidity position created in Problem 2, what are asset balances when the
        // price changes to P = 2500 USDC per ETH?
        let (x,y) = (2_f64,4000_f64);
        let (p_orig, p_new) = (y/x, 2500_f64);
        let (pa, pb) = (4000_f64/3.0, 3000_f64);

        let l = Pool::liq_from_x_y_rp_rng(x,y,p_orig.sqrt(),pa.sqrt(),pb.sqrt());
        //method 1: 
        let x_new= Pool::x_from_l_rp_rng(l, p_new.sqrt(), pa.sqrt(),pb.sqrt());
        let y_new= Pool::y_from_l_rp_rng(l, p_new.sqrt(), pa.sqrt(),pb.sqrt());
        assert_eq!(x_new, 0.8493641204744684); // python 0.8493641204744687
        assert_eq!(y_new, 6572.9000439693490); // python 6572.9000439693455
        
        // method 2: 
        let dx= Pool::dx_from_l_drp(l, p_orig.sqrt(), p_new.sqrt());
        let dy= Pool::dy_from_l_drp(l, p_orig.sqrt(), p_new.sqrt());
        let (x_new_bis, y_new_bis) = (x + dx, y + dy);
        assert_eq!(x_new_bis, 0.8493641204744682); // python 0.8493641204744682
        assert_eq!(y_new_bis, 6572.900043969347); // python 6572.900043969347
    }

    #[test]
    fn tick_is_under_rp() {
        let pool = Pool::new("ETH", 18, "USDC",6,
    4000_f64.sqrt(), 30, 0.0, 0.0) ;
        
        assert!( Pool::tick_to_rp(pool.glbl_tick()) <= pool.glbl_rp());

        assert_eq!(pool.glbl_rp(), 4000_f64.sqrt());
        assert_eq!(Pool::rp_to_tick(4000_f64.sqrt(), false), 82944);

        assert_eq!(pool.glbl_tick(), 82920);
        assert_eq!(Pool::rp_to_possible_tk(pool.glbl_rp(), 30, false), 82920);
        assert_eq!(Pool::rp_to_possible_tk(pool.glbl_rp(), 30, true), 82950);
    }

}
