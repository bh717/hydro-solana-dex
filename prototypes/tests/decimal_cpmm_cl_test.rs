//* these test correspond to all examples in pool.iypnb, (deposits and swaps)
//* of the python prototype

#[cfg(test)]
mod tests {

    use hydra_math_rs::decimal::*;
    use prototypes::cl_pool::*;

    #[test]
    fn test_deposit() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(1333).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );
        // // println!("{:?}", pool);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();

        // without flooring in deposit
        assert_eq!(x, Decimal::new(1_999275813881, COMPUTE_SCALE, false)); // float 1.999275544022923, PN 1_999275547735
        assert_eq!(y, Decimal::new(3999_999999999996, COMPUTE_SCALE, false));
        //  float 4000_f64, PN 3999_999999999998

        assert_eq!(x_adj, zero);
        assert_eq!(x_fee, zero);
        assert_eq!(y_adj, zero);
        assert_eq!(y_fee, zero);
    }

    #[test]
    fn test_single_x_swap_no_fees() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(1333).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );

        let rez = pool.execute_swap_from_x(Decimal::from_u64(3).to_compute_scale(), zero);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();
        // println!("{:#?}", pool.x_info());
        // println!("{:#?}", pool.y_info());

        // without liq flooring
        assert_eq!(
            rez.recv_amount(),
            Decimal::new(2_449955017843, COMPUTE_SCALE, false)
        ); // float 2.4499546960008143_f64, PN 2_449954700443
        assert_eq!(
            rez.send_amount(),
            Decimal::new(3999_999999999996, COMPUTE_SCALE, true)
        ); // float  -4000_f64, PN 3999_999999999998
        assert_eq!(
            x,
            Decimal::new(1_999275813881, COMPUTE_SCALE, false) // from preceding test
                .add(rez.recv_amount())
                .unwrap()
        );
        assert_eq!(
            y,
            Decimal::new(3999_999999999996, COMPUTE_SCALE, false) // from preceding test
                .add(rez.send_amount())
                .unwrap()
        );
        assert!(y.is_zero()); // entire amount of y in pool swapped

        assert_eq!(x_adj, zero);
        assert_eq!(x_fee, zero);
        assert_eq!(y_adj, zero);
        assert_eq!(y_fee, zero);
    }

    #[test]
    fn test_breaking_trades_x() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(1333).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );

        pool.execute_swap_from_x(Decimal::from_u64(3).to_compute_scale(), zero);
        let (x, _, _) = pool.x_info();
        let (y, _, _) = pool.y_info();

        let mut pool_bis = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, zero);
        pool_bis.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );

        pool_bis.execute_swap_from_x(Decimal::from_u64(1).to_compute_scale(), zero);
        pool_bis.execute_swap_from_x(Decimal::from_u64(1).to_compute_scale(), zero);
        pool_bis.execute_swap_from_x(Decimal::from_u64(1).to_compute_scale(), zero);
        let (x_bis, _, _) = pool_bis.x_info();
        let (y_bis, _, _) = pool_bis.y_info();

        // breaking up trade should be slighlty more advantageous for pool, due to rounding, if any
        assert!(x_bis.gte(x).unwrap());
        assert!(y_bis.gte(y).unwrap());

        // out of liquidity, globally, as moved out of range while trying go get in new range
        assert!(pool.glbl_liq().is_zero());
        assert!(pool_bis.glbl_liq().is_zero());

        let extra = pool.execute_swap_from_x(Decimal::from_u64(1).to_compute_scale(), zero);
        let extra_bis = pool_bis.execute_swap_from_x(Decimal::from_u64(1).to_compute_scale(), zero);

        // so swapped amount shoud be zero
        assert!(extra.recv_amount().is_zero());
        assert!(extra.send_amount().is_zero());
        assert!(extra_bis.recv_amount().is_zero());
        assert!(extra_bis.send_amount().is_zero());
    }

    #[test]
    fn test_pool_starts_w_no_liq_in_range_x() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(150).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(100).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(140).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("SOL", 12, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "dude",
            Decimal::from_u64(4).to_compute_scale(),
            Decimal::from_u64(600).to_compute_scale(),
            rpa,
            rpb,
        );

        // no x should be have been deposited in pool, given deposit range is below pool price.
        assert!(pool.x_info().0.is_zero());
        assert!(pool.y_info().0.is_positive());
        assert!(pool.glbl_liq().is_zero()); // no liquidity in range

        let rez = pool.execute_swap_from_x(Decimal::from_u64(2).to_compute_scale(), zero);

        // trades executed after getting in range
        // swapped_x  > 0.0
        assert!(rez.recv_amount().is_positive());
        // swapped_y  < 0.0
        assert!(rez.send_amount().is_negative());
        // we should have liquidity in range after trade
        assert!(pool.glbl_liq().is_positive());
        // now we should have some x in the pool
        assert!(pool.x_info().0.is_positive());
        // price has moved down from start (deposit time)
        assert!(pool.glbl_rp().lt(rp).unwrap());
        // price still above lower bound rpa as trade didnt drain all liquidity / y reserves
        assert!(pool.glbl_rp().gt(rpa).unwrap());

        assert_eq!(rez.recv_amount(), Decimal::from_u64(2).to_compute_scale());

        // if liq.floor() NOT used used in depost function
        assert_eq!(
            pool.glbl_liq(),
            Decimal::new(327_576681858244, COMPUTE_SCALE, false)
        ); // PN 327_576662414490
    }

    #[test]
    fn test_liquidity_gap_on_the_way_down() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(200).to_compute_scale().sqrt().unwrap();

        let rpa_dude = Decimal::from_u64(175).to_compute_scale().sqrt().unwrap();
        let rpb_dude = Decimal::from_u64(250).to_compute_scale().sqrt().unwrap();

        let rpa_mate = Decimal::from_u64(120).to_compute_scale().sqrt().unwrap();
        let rpb_mate = Decimal::from_u64(150).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("SOL", 12, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "dude",
            Decimal::from_u64(4).to_compute_scale(),
            Decimal::from_u64(600).to_compute_scale(),
            rpa_dude,
            rpb_dude,
        ); // * [175,250] is deposit range for 'dude'
        pool.deposit(
            "mate",
            zero,
            Decimal::from_u64(400).to_compute_scale(),
            rpa_mate,
            rpb_mate,
        ); // * [120,150] is deposit range for 'mate'

        //* there is a gap of liquidity between 150 and 175

        let rez = pool.execute_swap_from_x(Decimal::from_u64(7).to_compute_scale(), zero);
        // executed more X than 'available' in first range (i.e. 4 SOL)
        assert!(rez
            .recv_amount()
            .gt(Decimal::from_u64(4).to_compute_scale())
            .unwrap());
        // but did NOT fill the whole size of swap (i.e. 7 SOL)
        assert!(rez
            .recv_amount()
            .lt(Decimal::from_u64(7).to_compute_scale())
            .unwrap());
        // end_price in has at least entered lower range (120-150 ) in order to execute
        assert!(rez
            .end_price()
            .lt(Decimal::from_u64(120).to_compute_scale())
            .unwrap());
    }

    #[test]
    fn test_single_y_swap_no_fees() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(1333).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );

        let rez = pool.execute_swap_from_y(Decimal::from_u64(6000).to_compute_scale(), zero);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();

        // without liquidity 'flooring' during deposit
        assert_eq!(
            rez.send_amount(),
            Decimal::new(1_999275813881, COMPUTE_SCALE, true)
        ); // PN 1_999275547735
        assert_eq!(
            rez.recv_amount(),
            Decimal::new(4896_836737493549, COMPUTE_SCALE, false)
        ); // PN 4896_836754800713
        assert_eq!(
            x,
            Decimal::new(1_999275813881, COMPUTE_SCALE, false) // from previous test
                .add(rez.send_amount())
                .unwrap()
        );
        assert_eq!(
            y,
            Decimal::new(3999_999999999996, COMPUTE_SCALE, false) // from previous test
                .add(rez.recv_amount())
                .unwrap()
        );
        assert!(x.is_zero()); // entire amount of X in pool swapped out

        assert!(x_adj.is_zero());
        assert!(x_fee.is_zero());
        assert!(y_adj.is_zero());
        assert!(y_fee.is_zero());
    }

    #[test]
    fn test_breaking_trades_y() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(1333).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );

        pool.execute_swap_from_y(Decimal::from_u64(6000).to_compute_scale(), zero);
        let (x, _, _) = pool.x_info();
        let (y, _, _) = pool.y_info();

        let mut pool_bis = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, zero);
        pool_bis.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );

        pool_bis.execute_swap_from_y(Decimal::from_u64(2000).to_compute_scale(), zero);
        pool_bis.execute_swap_from_y(Decimal::from_u64(2000).to_compute_scale(), zero);
        pool_bis.execute_swap_from_y(Decimal::from_u64(2000).to_compute_scale(), zero);
        let (x_bis, _, _) = pool_bis.x_info();
        let (y_bis, _, _) = pool_bis.y_info();

        // breaking up trade should be slighlty more advantageous for pool, due to rounding, if any
        assert!(x_bis.gte(x).unwrap());
        assert!(y_bis.gte(y).unwrap());

        // out of liquidity, globally, as moved out of range while trying go get in new range
        assert!(pool.glbl_liq().is_zero());
        assert!(pool_bis.glbl_liq().is_zero());

        let extra = pool.execute_swap_from_y(Decimal::from_u64(500).to_compute_scale(), zero);
        let extra_bis =
            pool_bis.execute_swap_from_y(Decimal::from_u64(500).to_compute_scale(), zero);

        // //so swapped amount shoud be zero
        assert!(extra.recv_amount().is_zero());
        assert!(extra.send_amount().is_zero());
        assert!(extra_bis.recv_amount().is_zero());
        assert!(extra_bis.send_amount().is_zero());
    }

    #[test]
    fn test_pool_starts_w_no_liq_in_range_y() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(150).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(180).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(230).to_compute_scale().sqrt().unwrap();
        let mut pool = Pool::new("SOL", 12, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "dude",
            Decimal::from_u64(4).to_compute_scale(),
            Decimal::from_u64(600).to_compute_scale(),
            rpa,
            rpb,
        );

        // no y should be have been deposited in pool, given range.
        assert!(pool.x_info().0.is_positive());
        assert!(pool.y_info().0.is_zero());
        assert!(pool.glbl_liq().is_zero()); // no liquidity in range

        let rez = pool.execute_swap_from_y(Decimal::from_u64(200).to_compute_scale(), zero);

        // trades executed after getting in range
        // swapped_x  < 0.0
        assert!(rez.send_amount().is_negative());
        // swapped_y  > 0.0
        assert!(rez.recv_amount().is_positive());
        // we should have liquidity in range after trade
        assert!(pool.glbl_liq().is_positive());
        // now we should have some y in the pool
        assert!(pool.y_info().0.is_positive());
        // price has moved up from start (deposit time)
        assert!(pool.glbl_rp().gt(rp).unwrap());
        // price still below upper bound rpb as trade didnt drain all liquidity / x reserves
        assert!(pool.glbl_rp().lt(rpb).unwrap());

        assert_eq!(rez.recv_amount(), Decimal::from_u64(200).to_compute_scale());
        // the whole demanded qty for y should be filled

        // if liq.floor() is NOT used in depost function
        assert_eq!(
            pool.glbl_liq(),
            Decimal::new(465_306804972182, COMPUTE_SCALE, false)
        ); // PN 465_306818467475
    }

    #[test]
    fn test_liquidity_gap_on_the_way_up() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(175).to_compute_scale().sqrt().unwrap();

        let rpa_dude = Decimal::from_u64(150).to_compute_scale().sqrt().unwrap();
        let rpb_dude = Decimal::from_u64(190).to_compute_scale().sqrt().unwrap();

        let rpa_mate = Decimal::from_u64(210).to_compute_scale().sqrt().unwrap();
        let rpb_mate = Decimal::from_u64(250).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("SOL", 12, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "dude",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(600).to_compute_scale(),
            rpa_dude,
            rpb_dude,
        ); // * [150,190] is deposit range for 'dude'
        pool.deposit(
            "mate",
            Decimal::from_u64(3).to_compute_scale(),
            zero,
            rpa_mate,
            rpb_mate,
        ); // * [210,250] is deposit range for 'mate'

        //*  gap of liquidity between 190 and 210

        let rez = pool.execute_swap_from_y(Decimal::from_u64(1500).to_compute_scale(), zero);

        // executed more Y than 'available' in first range (600 USD)
        assert!(rez
            .recv_amount()
            .gt(Decimal::from_u64(600).to_compute_scale())
            .unwrap());
        // but did NOT fill the whole size of swap (1500)
        assert!(rez
            .recv_amount()
            .lt(Decimal::from_u64(1500).to_compute_scale())
            .unwrap());
        // end_price did at least enter upper range (210-250) to execute
        assert!(pool
            .glbl_rp()
            .pow(2)
            .gt(Decimal::from_u64(210).to_compute_scale())
            .unwrap());
    }

    #[test]
    fn test_withdraw() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(200).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(174).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(250).to_compute_scale().sqrt().unwrap();

        let mut pool = Pool::new("SOL", 12, "USDC", 6, rp, 1, zero, zero);

        pool.deposit(
            "dude",
            Decimal::from_u64(4).to_compute_scale(),
            Decimal::from_u64(600).to_compute_scale(),
            rpa,
            rpb,
        );
        assert_eq!(pool.position_count(), 1);
        assert_eq!(pool.tick_count(), 2);

        assert!(pool.x_info().0.is_positive());
        assert!(pool.y_info().0.is_positive());

        let deposited = pool.glbl_liq();

        // no adjustements whatsoever during whole process (deposit, swap and withdrawal)
        if Pool::ADJ_WITHDRAWAL.is_zero() {
            pool.execute_swap_from_x(Decimal::from_u64(20).to_compute_scale(), zero);

            pool.withdraw("dude", deposited, rpa, rpb);

            assert_eq!(pool.position_count(), 0); // no more positions
            assert_eq!(pool.tick_count(), 0); // no initialized ticks
            assert!(pool.glbl_liq().is_zero()); // liq zero

            assert!(pool.x_info().0.is_zero());
            assert!(pool.y_info().0.is_zero());
            // both x and y reserves should be empty
        }

        // conservative adjustements at  withdrawal)
        if Pool::ADJ_WITHDRAWAL
            .eq(Decimal::new(1, COMPUTE_SCALE, false).to_compute_scale())
            .unwrap()
        {
            assert_eq!(
                pool.glbl_liq(),
                Decimal::new(535_700094901963, COMPUTE_SCALE, false)
            );
            pool.execute_swap_from_x(Decimal::from_u64(20).to_compute_scale(), zero);

            pool.withdraw("dude", deposited, rpa, rpb);

            assert_eq!(pool.position_count(), 0); // no more positions
            assert_eq!(pool.tick_count(), 0); // no initialized ticks
            assert_eq!(pool.glbl_liq(), zero); // liq zero

            // leftovers from rounding and at withdrawal (for x),
            assert!(pool.x_info().0.is_positive());
            assert!(pool.y_info().0.is_zero());
        }
    }
}
