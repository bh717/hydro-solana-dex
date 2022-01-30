//* these test correspond to all examples in pool.iypnb
//* of the python prototype

#[cfg(test)]
mod tests {

    use proto::cl_pool_float::*;

    #[test]
    fn problem1() {
        // A user has x = 2 ETH and wants to set up a liquidity position in an ETH/USDC pool.
        // The current price of ETH is P =2000 USDC and target price range is from pa = 1500 to
        // pb = 2500 USDC. How much USDC (y) do they need?
        let (pa, p, pb) = (1500f64, 2000f64, 2500f64);
        let lx = Pool::liq_x_only(2.0, p.sqrt(), pb.sqrt());
        assert_eq!(lx, 847.2135954999583);

        let y = Pool::y_from_l_rp_rng(lx, p.sqrt(), pa.sqrt(), pb.sqrt());
        assert_eq!(y, 5076.102359479882);
    }

    #[test]
    fn problem2() {
        // A user has x=2 ETH and y=4000 USDC, and wants to use pb =3000USDC perETH as the top of
        // the price range. What is the bottom of the range (pa) that ensures the opened position
        // uses the full amount of their funds?
        let (x, y) = (2_f64, 4000_f64);
        let p = y / x;
        let pb = 3000f64;

        //method 1
        let rpa = Pool::rpa_from_x_y_rp_rpb(x, y, p.sqrt(), pb.sqrt());
        assert_eq!(rpa.powi(2), 1333.3333333333333);

        // method 2
        let lx = Pool::liq_x_only(2.0, p.sqrt(), pb.sqrt());
        let rpa_bis = Pool::rpa_from_l_rp_y(lx, p.sqrt(), y);
        assert_eq!(rpa_bis.powi(2), 1333.3333333333337);
    }

    #[test]
    fn problem3() {
        // Using the liquidity position created in Problem 2, what are asset balances when the
        // price changes to P = 2500 USDC per ETH?
        let (x, y) = (2_f64, 4000_f64);
        let (p_orig, p_new) = (y / x, 2500_f64);
        let (pa, pb) = (4000_f64 / 3.0, 3000_f64);

        let l = Pool::liq_from_x_y_rp_rng(x, y, p_orig.sqrt(), pa.sqrt(), pb.sqrt());
        //method 1:
        let x_new = Pool::x_from_l_rp_rng(l, p_new.sqrt(), pa.sqrt(), pb.sqrt());
        let y_new = Pool::y_from_l_rp_rng(l, p_new.sqrt(), pa.sqrt(), pb.sqrt());
        assert_eq!(x_new, 0.8493641204744679); // python 0.8493641204744687
        assert_eq!(y_new, 6572.9000439693455); // python 6572.9000439693455

        // method 2:
        let dx = Pool::dx_from_l_drp(l, p_orig.sqrt(), p_new.sqrt());
        let dy = Pool::dy_from_l_drp(l, p_orig.sqrt(), p_new.sqrt());
        let (x_new_bis, y_new_bis) = (x + dx, y + dy);
        assert_eq!(x_new_bis, 0.8493641204744686); // python 0.8493641204744682
        assert_eq!(y_new_bis, 6572.900043969346); // python 6572.900043969347
    }

    #[test]
    fn tick_is_under_rp() {
        let pool = Pool::new("ETH", 18, "USDC", 6, 4000_f64.sqrt(), 30, 0.0, 0.0);

        assert!(Pool::tick_to_rp(pool.glbl_tick()) <= pool.glbl_rp());

        assert!(pool.glbl_rp() <= 4000_f64.sqrt());
        assert_eq!(Pool::rp_to_tick(4000_f64.sqrt(), false), 82944);

        assert_eq!(pool.glbl_tick(), 82920);
        assert_eq!(Pool::rp_to_possible_tk(4000_f64.sqrt(), 30, false), 82920);
        assert_eq!(Pool::rp_to_possible_tk(4000_f64.sqrt(), 30, true), 82950);
    }

    // #[test]
    // fn test_set_position() {
    //     let mut pool = Pool::new("ETH", 18, "USDC",6,
    // 4000_f64.sqrt(), 100, 0.0, 0.0) ;
    //     assert_eq!(pool.glbl_tick(), 82900);
    //     assert!( Pool::tick_to_rp(pool.glbl_tick()) == pool.glbl_rp());

    //     pool._set_position("123", 80000, 90000, 300.0);
    //     // println!("{:?}", pool);
    //     assert_eq!(pool.glbl_liq(), 300_f64);

    //     pool._set_position("888", 90000,95000 , 200.0);
    //     // println!("{:?}", pool);
    //     assert_eq!(pool.glbl_liq(), 300_f64);

    //     pool._set_position("888", 70000, 95000, 400.0);
    //     // println!("{:?}", pool);
    //     assert_eq!(pool.glbl_liq(), 700_f64);

    //     pool._set_position("888", 90000, 95000, -200.0);
    //     println!("{:?}", pool);
    //     assert_eq!(pool.glbl_liq(), 700_f64);

    // }

    #[test]
    fn test_deposit() {
        let mut pool = Pool::new("ETH", 18, "USDC", 6, 2000_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("abc", 2.0, 4000.0, 1333_f64.sqrt(), 3000_f64.sqrt());
        // println!("{:?}", pool);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();

        if Pool::ADJ_WHOLE_FILL == 0.0 {
            if Pool::FLOOR_LIQ {
                assert_eq!(x, 1.9984356160643284_f64); // with liq.floor() in deposit
                assert_eq!(y, 3998.3195353714877_f64); // with liq.floor() in deposit
            } else {
                assert_eq!(x, 1.999275544022923_f64); // without flooring
                assert_eq!(y, 4000_f64); // without flooring
            }
        }

        assert_eq!(x_adj, 0_f64);
        assert_eq!(x_fee, 0_f64);
        assert_eq!(y_adj, 0_f64);
        assert_eq!(y_fee, 0_f64);
    }

    #[test]
    fn test_single_x_swap_no_fees() {
        let mut pool = Pool::new("ETH", 18, "USDC", 6, 2000_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("abc", 2.0, 4000.0, 1333_f64.sqrt(), 3000_f64.sqrt());

        let rez = pool.execute_swap_from_x(3.0, 0.0);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();

        if Pool::ADJ_WHOLE_FILL == 0.0 {
            if Pool::FLOOR_LIQ {
                assert_eq!(rez.0, 2.4489254304487926_f64); // with liq.floor() in deposit
                assert_eq!(rez.1, -3998.3195353714877_f64); // with liq.floor() in deposit
                assert_eq!(x, 1.9984356160643284_f64 + rez.0); // with liq.floor() in deposit
                assert_eq!(y, 3998.3195353714877_f64 + rez.1); // with liq.floor() in deposit
            } else {
                assert_eq!(rez.0, 2.4499546960008143_f64); // without liq flooring
                assert_eq!(rez.1, -4000_f64); // without liq flooring
                assert_eq!(x, 1.999275544022923_f64 + rez.0); // without liq flooring
                assert_eq!(y, 4000_f64 + rez.1); // without liq flooring
            }
        }
        assert_eq!(x_adj, 0_f64);
        assert_eq!(x_fee, 0_f64);
        assert_eq!(y_adj, 0_f64);
        assert_eq!(y_fee, 0_f64);
    }

    #[test]
    fn test_breaking_trades_x() {
        let mut pool = Pool::new("ETH", 18, "USDC", 6, 2000_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("abc", 2.0, 4000.0, 1333_f64.sqrt(), 3000_f64.sqrt());
        pool.execute_swap_from_x(3.0, 0.0);
        let (x, _, _) = pool.x_info();
        let (y, _, _) = pool.y_info();

        let mut pool_bis = Pool::new("ETH", 18, "USDC", 6, 2000_f64.sqrt(), 1, 0.0, 0.0);
        pool_bis.deposit("abc", 2.0, 4000.0, 1333_f64.sqrt(), 3000_f64.sqrt());

        pool_bis.execute_swap_from_x(1.0, 0.0);
        pool_bis.execute_swap_from_x(1.0, 0.0);
        pool_bis.execute_swap_from_x(1.0, 0.0);
        let (x_bis, _, _) = pool_bis.x_info();
        let (y_bis, _, _) = pool_bis.y_info();

        if Pool::FLOOR_LIQ {
            // breaking up trade should be slighlty more advantageous for pool, due to rounding
            assert!(x_bis >= x); // with liq.floor() in deposit
            assert!(y_bis >= y); // with liq.floor() in deposit
        }

        // out of liquidity
        assert_eq!(pool.glbl_liq(), 0.0);
        assert_eq!(pool_bis.glbl_liq(), 0.0);

        let extra = pool.execute_swap_from_x(0.75, 0.0);
        let extra_bis = pool_bis.execute_swap_from_x(0.75, 0.0);

        //so swapped amount shoud be zero
        assert_eq!(extra.0, 0.0);
        assert_eq!(extra.1, 0.0);
        assert_eq!(extra_bis.0, 0.0);
        assert_eq!(extra_bis.1, 0.0);
    }

    #[test]
    fn test_pool_starts_w_no_liq_in_range_x() {
        let mut pool = Pool::new("SOL", 12, "USDC", 6, 150_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("dude", 4.0, 600.0, 100_f64.sqrt(), 140_f64.sqrt());

        // no x should be have been deposited in pool, given range.
        assert_eq!(pool.x_info().0, 0.0);
        assert!(pool.y_info().0 > 0.0);
        assert_eq!(pool.glbl_liq(), 0.0); // no liq in range

        let rez = pool.execute_swap_from_x(2.0, 0.0);

        // trades executed after getting in range
        assert!(rez.0 > 0.0);
        assert!(rez.1 < 0.0);
        assert!(pool.glbl_liq() > 0.0);
        assert!(pool.x_info().0 > 0.0);
        assert!(pool.glbl_rp().powi(2) > 100.0);
        assert!(pool.glbl_rp().powi(2) < 150.0);

        if Pool::ADJ_WHOLE_FILL == 0.0 {
            assert_eq!(rez.0, 2.0); // when ADJ_WHOLE_FILL set to zero
        }
        if Pool::FLOOR_LIQ {
            assert_eq!(pool.glbl_liq(), 327.0); // if liq.floor() is used in depost function
        }
        // println!("{:?}", pool);
    }

    #[test]
    fn test_liquidity_gap_on_the_way_down() {
        let mut pool = Pool::new("SOL", 12, "USDC", 6, 200_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("dude", 4.0, 600.0, 175_f64.sqrt(), 250_f64.sqrt());
        pool.deposit("mate", 0.0, 400.0, 120_f64.sqrt(), 150_f64.sqrt());
        // gap of liquidity between 175 and 150

        if Pool::ADJ_WHOLE_FILL > 0.0 {
            let rez = pool.execute_swap_from_x(7.0, 0.0);
            assert!(rez.0 > 4.0); // executed more than available in first range
            assert!(rez.0 < 7.0);

            println!("{:?}", pool);
        }
    }

    #[test]
    fn test_single_y_swap_no_fees() {
        let mut pool = Pool::new("ETH", 18, "USDC", 6, 2000_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("abc", 2.0, 4000.0, 1333_f64.sqrt(), 3000_f64.sqrt());

        let rez = pool.execute_swap_from_y(6000.0, 0.0);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();

        if Pool::ADJ_WHOLE_FILL == 1.0e-12 {
            if Pool::FLOOR_LIQ {
                assert_eq!(rez.0, -1.9984356160623287_f64); // with liq.floor() in deposit
                assert_eq!(rez.1, 4894.779514837586_f64); // with liq.floor() in deposit
                assert_eq!(x, 1.9984356160643284_f64 + rez.0); // with liq.floor() in deposit
                assert_eq!(y, 3998.3195353714877_f64 + rez.1); // with liq.floor() in deposit
            } else {
                assert_eq!(rez.0, -1.9992755440209227_f64); // without liq flooring
                assert_eq!(rez.1, 4896.836755077212_f64); // without liq flooring
                assert_eq!(x, 1.999275544022923_f64 + rez.0); // without liq flooring
                assert_eq!(y, 4000_f64 + rez.1); // without liq flooring
            }
        }
        assert_eq!(x_adj, 0_f64);
        assert_eq!(x_fee, 0_f64);
        assert_eq!(y_adj, 0_f64);
        assert_eq!(y_fee, 0_f64);
    }

    #[test]
    fn test_breaking_trades_y() {
        let mut pool = Pool::new("ETH", 18, "USDC", 6, 2000_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("abc", 2.0, 4000.0, 1333_f64.sqrt(), 3000_f64.sqrt());
        pool.execute_swap_from_y(6000.0, 0.0);
        let (x, _, _) = pool.x_info();
        let (y, _, _) = pool.y_info();

        let mut pool_bis = Pool::new("ETH", 18, "USDC", 6, 2000_f64.sqrt(), 1, 0.0, 0.0);
        pool_bis.deposit("abc", 2.0, 4000.0, 1333_f64.sqrt(), 3000_f64.sqrt());

        pool_bis.execute_swap_from_y(2000.0, 0.0);
        pool_bis.execute_swap_from_y(2000.0, 0.0);
        pool_bis.execute_swap_from_y(2000.0, 0.0);
        let (x_bis, _, _) = pool_bis.x_info();
        let (y_bis, _, _) = pool_bis.y_info();

        if Pool::FLOOR_LIQ {
            // breaking up trade should be slighlty more advantageous for pool, due to rounding
            assert!(x_bis >= x); // with liq.floor() in deposit
            assert!(y_bis >= y); // with liq.floor() in deposit
        }

        // out of liquidity
        assert_eq!(pool.glbl_liq(), 0.0);
        assert_eq!(pool_bis.glbl_liq(), 0.0);

        let extra = pool.execute_swap_from_y(500.0, 0.0);
        let extra_bis = pool_bis.execute_swap_from_y(500.0, 0.0);

        //so swapped amount shoud be zero
        assert_eq!(extra.0, 0.0);
        assert_eq!(extra.1, 0.0);
        assert_eq!(extra_bis.0, 0.0);
        assert_eq!(extra_bis.1, 0.0);
    }

    #[test]
    fn test_pool_starts_w_no_liq_in_range_y() {
        let mut pool = Pool::new("SOL", 12, "USDC", 6, 150_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("dude", 4.0, 600.0, 180_f64.sqrt(), 230_f64.sqrt());

        // no x should be have been deposited in pool, given range.
        assert!(pool.x_info().0 > 0.0);
        assert_eq!(pool.y_info().0, 0.0);
        assert_eq!(pool.glbl_liq(), 0.0); // no liq in range

        let rez = pool.execute_swap_from_y(200.0, 0.0);

        // trades executed after getting in range
        assert!(rez.0 < 0.0);
        assert!(rez.1 > 0.0);
        assert!(pool.glbl_liq() > 0.0);
        assert!(pool.y_info().0 > 0.0);
        assert!(pool.glbl_rp().powi(2) > 180.0);
        assert!(pool.glbl_rp().powi(2) < 230.0);

        if Pool::ADJ_WHOLE_FILL == 0.0 {
            assert_eq!(rez.1, 200.0); // when ADJ_WHOLE_FILL set to zero
        }
        if Pool::FLOOR_LIQ {
            assert_eq!(pool.glbl_liq(), 465.0); // if liq.floor() is used in depost function
        }
        // println!("{:?}", pool);
    }

    #[test]
    fn test_liquidity_gap_on_the_way_up() {
        let mut pool = Pool::new("SOL", 12, "USDC", 6, 175_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("dude", 2.0, 600.0, 150_f64.sqrt(), 190_f64.sqrt());
        pool.deposit("mate", 3.0, 0.0, 210_f64.sqrt(), 250_f64.sqrt());
        // gap of liquidity between 190 and 210

        if Pool::ADJ_WHOLE_FILL > 0.0 {
            let rez = pool.execute_swap_from_y(1500.0, 0.0);
            assert!(rez.1 > 600.0); // executed more than available in first range
            assert!(rez.1 < 1500.0);
            assert!(rez.5 < 250.0); // end_price in upper range
            assert!(pool.glbl_rp().powi(2) > 210.0); // end_price in upper range

            // println!("{:?}", pool);
        }
    }
    #[test]
    fn test_withdraw() {
        let mut pool = Pool::new("SOL", 12, "USDC", 6, 200_f64.sqrt(), 1, 0.0, 0.0);
        pool.deposit("dude", 4.0, 600.0, 174_f64.sqrt(), 250_f64.sqrt());
        assert_eq!(pool.position_count(), 1); // empty pool
        assert_eq!(pool.tick_count(), 2);

        assert!(pool.x_info().0 >= 0.0);
        assert!(pool.y_info().0 >= 0.0);

        if Pool::FLOOR_LIQ && Pool::ADJ_WITHDRAWAL > 0.0 {
            assert_eq!(pool.glbl_liq(), 535.0);
            pool.execute_swap_from_x(20.0, 0.0);

            // pool.withdraw( "mate", 535.0, 174_f64.sqrt(), 250_f64.sqrt());
            pool.withdraw("dude", 535.0, 174_f64.sqrt(), 250_f64.sqrt());

            assert_eq!(pool.position_count(), 0); // no more positions
            assert_eq!(pool.tick_count(), 0); // no initialized ticks
            assert_eq!(pool.glbl_liq(), 0.0); // liq zero

            assert!(pool.x_info().0 > 0.0); // leftovers from rounding at withdrawal
            assert!(pool.y_info().0 > 0.0);

            // println!("{:?}", pool);
        }
    }
}
