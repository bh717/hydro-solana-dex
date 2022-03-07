//* these test correspond to all examples in pool.iypnb, (deposits and swaps)
//* of the python prototype

#[cfg(test)]
mod tests {

    use hydra_proto::cl_pool_pn::hydra_math_legacy::sqrt_precise;
    use hydra_proto::cl_pool_pn::*;

    #[test]
    fn test_deposit() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(2000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(1333)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000)).unwrap();
        let mut pool = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);
        // println!("{:?}", pool);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();

        if PoolPN::FLOOR_LIQ {
            // with liq.floor() in deposit float 1.9984356160643284
            assert_eq!(x, &PoolPN::pn_from_innner_value(1_998435617475)); // float 1.9984356160643284
            assert_eq!(y, &PoolPN::pn_from_innner_value(3998_319530769404)); //  float 3998.3195353714877
        } else {
            // without flooring in deposit
            assert_eq!(x, &PoolPN::pn_from_innner_value(1_999275547735)); // float 1.999275544022923
            assert_eq!(y, &PoolPN::pn_from_innner_value(3999_999999999998)); //  float 4000_f64
        }
        // }

        assert_eq!(x_adj, &zero);
        assert_eq!(x_fee, &zero);
        assert_eq!(y_adj, &zero);
        assert_eq!(y_fee, &zero);
    }

    #[test]
    fn test_single_x_swap_no_fees() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(2000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(1333)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000)).unwrap();
        let mut pool = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);

        let rez = pool.execute_swap_from_x(Swp::new(PoolPN::pn(3), false), &zero);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();
        // println!("{:#?}", pool.x_info());
        // println!("{:#?}", pool.y_info());

        if PoolPN::adj_whole_fill().eq(&zero) {
            if PoolPN::FLOOR_LIQ {
                // with liq.floor() in deposit
                assert_eq!(
                    rez.recv_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(2_448925432070), false)
                ); // float 2.4489254304487926_f64
                assert_eq!(
                    rez.send_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(3998_319530769404), true)
                ); // float -3998.3195353714877_f64
                assert_eq!(
                    x,
                    &PoolPN::pn_from_innner_value(1_998435617475) // from preceding test
                        .checked_add(&rez.recv_amount().amt)
                        .unwrap()
                );
                assert_eq!(
                    y,
                    &PoolPN::pn_from_innner_value(3998_319530769404) // from preceding test
                        .checked_sub(&rez.send_amount().amt)
                        .unwrap()
                );
                assert_eq!(y, &zero); // whole of y in pool swapped, as no fill_adj
            } else {
                // without liq flooring
                assert_eq!(
                    rez.recv_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(2_449954700443), false)
                ); // float 2.4499546960008143_f64
                assert_eq!(
                    rez.send_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(3999_999999999998), true)
                ); // float  -4000_f64
                assert_eq!(
                    x,
                    &PoolPN::pn_from_innner_value(1_999275547735) // from preceding test
                        .checked_add(&rez.recv_amount().amt)
                        .unwrap()
                );
                assert_eq!(
                    y,
                    &PoolPN::pn_from_innner_value(3999_999999999998) // from preceding test
                        .checked_sub(&rez.send_amount().amt)
                        .unwrap()
                );
                assert_eq!(y, &zero); // whole of y in pool swapped, as no fill_adj
            }
        }
        if PoolPN::adj_whole_fill().eq(&PoolPN::pn_from_innner_value(1)) {
            if PoolPN::FLOOR_LIQ {
                // with liq.floor() in deposit
                assert_eq!(
                    rez.recv_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(2_448925432070), false)
                ); // same as with no fill_adj because it is the received token
                assert_eq!(
                    rez.send_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(3998_319530765406), true)
                ); // lesss (in abs value) than when no fill_adj : 3998319530769404
                assert_eq!(
                    x,
                    &PoolPN::pn_from_innner_value(1_998435617475) // from preceding test
                        .checked_add(&rez.recv_amount().amt)
                        .unwrap()
                );
                assert_eq!(
                    y,
                    &PoolPN::pn_from_innner_value(3998_319530769404) // from preceding test
                        .checked_sub(&rez.send_amount().amt)
                        .unwrap()
                );
                assert!(y.greater_than(&zero)); // some of y left in pool, because of fill_adj
            } else {
                // without liq flooring
                assert_eq!(
                    rez.recv_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(2_449954700443), false)
                ); // same as with no fill_adj because it is the received token
                assert_eq!(
                    rez.send_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(3999_999999995998), true)
                ); // lesss (in abs value) than when no fill_adj : 3999999999999998
                assert_eq!(
                    x,
                    &PoolPN::pn_from_innner_value(1_999275547735) // from preceding test
                        .checked_add(&rez.recv_amount().amt)
                        .unwrap()
                );
                assert_eq!(
                    y,
                    &PoolPN::pn_from_innner_value(3999_999999999998) // from preceding test
                        .checked_sub(&rez.send_amount().amt)
                        .unwrap()
                );
                assert!(y.greater_than(&zero)); // some of y left in pool, because of fill_adj
            }
        }
        assert_eq!(x_adj, &zero);
        assert_eq!(x_fee, &zero);
        assert_eq!(y_adj, &zero);
        assert_eq!(y_fee, &zero);
    }

    #[test]
    fn test_breaking_trades_x() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(2000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(1333)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000)).unwrap();
        let mut pool = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);
        pool.execute_swap_from_x(Swp::new(PoolPN::pn(3), false), &zero);
        let (x, _, _) = pool.x_info();
        let (y, _, _) = pool.y_info();

        let mut pool_bis = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool_bis.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);

        pool_bis.execute_swap_from_x(Swp::new(PoolPN::pn(1), false), &zero);
        pool_bis.execute_swap_from_x(Swp::new(PoolPN::pn(1), false), &zero);
        pool_bis.execute_swap_from_x(Swp::new(PoolPN::pn(1), false), &zero);
        let (x_bis, _, _) = pool_bis.x_info();
        let (y_bis, _, _) = pool_bis.y_info();

        // breaking up trade should be slighlty more advantageous for pool, due to rounding
        assert!(x_bis.greater_than_or_equal(&x));
        assert!(y_bis.greater_than_or_equal(&y));

        // out of liquidity, globally, as moved out of range while trying go get in new range
        assert_eq!(pool.glbl_liq().amt, zero);
        assert_eq!(pool.glbl_liq().neg, false);
        assert_eq!(pool_bis.glbl_liq().amt, zero);
        assert_eq!(pool_bis.glbl_liq().neg, false);

        let extra = pool.execute_swap_from_x(Swp::new(PoolPN::pn(1), false), &zero);
        let extra_bis = pool_bis.execute_swap_from_x(Swp::new(PoolPN::pn(1), false), &zero);

        //so swapped amount shoud be zero
        assert_eq!(extra.recv_amount().amt, zero);
        assert_eq!(extra.send_amount().amt, zero);
        assert_eq!(extra_bis.recv_amount().amt, zero);
        assert_eq!(extra_bis.send_amount().amt, zero);
    }

    #[test]
    fn test_pool_starts_w_no_liq_in_range_x() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(150)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(100)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(140)).unwrap();
        let mut pool = PoolPN::new("SOL", 12, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit("dude", &PoolPN::pn(4), &PoolPN::pn(600), &rpa, &rpb);

        // no x should be have been deposited in pool, given range.
        assert_eq!(pool.x_info().0, &zero);
        assert!(pool.y_info().0.greater_than(&zero));
        assert_eq!(pool.glbl_liq().amt, zero); // no liq in range

        let rez = pool.execute_swap_from_x(Swp::new(PoolPN::pn(2), false), &zero);

        // trades executed after getting in range
        // swapped_x  > 0.0
        assert!(rez.recv_amount().amt.greater_than(&zero));
        // swapped_y  < 0.0
        assert!(rez.send_amount().amt.greater_than(&zero) && rez.send_amount().neg);
        // we should have liquidity in range after trade
        assert!(pool.glbl_liq().amt.greater_than(&zero) && !pool.glbl_liq().neg);
        // now we should have some x in the pool
        assert!(pool.x_info().0.greater_than(&zero));
        // price has moved down from start (deposit time)
        assert!(pool.glbl_rp().less_than(&rp));
        // price still above lower bound rpa as trade didnt drain all liquidity / y reserves
        assert!(pool.glbl_rp().greater_than(&rpa));

        if PoolPN::adj_whole_fill().eq(&zero) {
            // when ADJ_WHOLE_FILL set to zero
            assert_eq!(rez.recv_amount().amt, PoolPN::pn(2));
        }
        if PoolPN::FLOOR_LIQ {
            // if liq.floor() is used in depost function
            assert_eq!(pool.glbl_liq().amt, PoolPN::pn(327));
        } else {
            // if liq.floor() NOT used used in depost function
            assert_eq!(
                pool.glbl_liq().amt,
                PoolPN::pn_from_innner_value(327_576662414490)
            );
        }
    }

    #[test]
    fn test_liquidity_gap_on_the_way_down() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(200)).unwrap();
        let rpa_dude = sqrt_precise(&PoolPN::pn(175)).unwrap();
        let rpb_dude = sqrt_precise(&PoolPN::pn(250)).unwrap();
        let rpa_mate = sqrt_precise(&PoolPN::pn(120)).unwrap();
        let rpb_mate = sqrt_precise(&PoolPN::pn(150)).unwrap();
        let mut pool = PoolPN::new("SOL", 12, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit(
            "dude",
            &PoolPN::pn(4),
            &PoolPN::pn(600),
            &rpa_dude,
            &rpb_dude,
        );
        pool.deposit("mate", &zero, &PoolPN::pn(400), &rpa_mate, &rpb_mate);
        //*  gap of liquidity between 175 and 150

        let rez = pool.execute_swap_from_x(Swp::new(PoolPN::pn(7), false), &zero);
        // executed more X than 'available' in first range (4)
        assert!(rez.recv_amount().amt.greater_than(&PoolPN::pn(4)));
        // but did NOT fill the whole size of swap (7)
        assert!(rez.recv_amount().amt.less_than(&PoolPN::pn(7)));
        // end_price in has at least entered lower range (120-150 ) in order to execute
        assert!(rez.end_price().less_than(&PoolPN::pn(120)));
    }

    #[test]
    fn test_single_y_swap_no_fees() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(2000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(1333)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000)).unwrap();
        let mut pool = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);

        let rez = pool.execute_swap_from_y(Swp::new(PoolPN::pn(6000), false), &zero);
        let (x, x_adj, x_fee) = pool.x_info();
        let (y, y_adj, y_fee) = pool.y_info();

        if PoolPN::adj_whole_fill().eq(&zero) {
            if PoolPN::FLOOR_LIQ {
                // with liq.floor() in deposit
                assert_eq!(
                    rez.send_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(1_998435617475), true)
                ); //
                assert_eq!(
                    rez.recv_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(4894_779508927292), false)
                ); //
                assert_eq!(
                    x,
                    &PoolPN::pn_from_innner_value(1_998435617475) // from preceding test
                        .checked_sub(&rez.send_amount().amt)
                        .unwrap()
                );
                assert_eq!(
                    y,
                    &PoolPN::pn_from_innner_value(3998_319530769404) // from preceding test
                        .checked_add(&rez.recv_amount().amt)
                        .unwrap()
                );
                assert_eq!(x, &zero); // whole of x in pool swapped, as no fill_adj
            } else {
                // without liq flooring
                assert_eq!(
                    rez.send_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(1_999275547735), true)
                ); //
                assert_eq!(
                    rez.recv_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(4896_836754800713), false)
                ); //
                assert_eq!(
                    x,
                    &PoolPN::pn_from_innner_value(1_999275547735) // from preceding test
                        .checked_sub(&rez.send_amount().amt)
                        .unwrap()
                );
                assert_eq!(
                    y,
                    &PoolPN::pn_from_innner_value(3999_999999999998) // from preceding test
                        .checked_add(&rez.recv_amount().amt)
                        .unwrap()
                );
                assert_eq!(x, &zero); // whole of x in pool swapped, as no fill_adj
            }
        }
        if PoolPN::adj_whole_fill().eq(&PoolPN::pn_from_innner_value(1)) {
            if PoolPN::FLOOR_LIQ {
                // with liq.floor() in deposit
                assert_eq!(
                    rez.send_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(1_998435617473), true)
                ); // float -1.9984356160623287_f64
                assert_eq!(
                    rez.recv_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(4894_779508927292), false)
                ); // float 4894.779514837586_f64
                assert_eq!(
                    x,
                    &PoolPN::pn_from_innner_value(1_998435617475) // from deposit test
                        .checked_sub(&rez.send_amount().amt)
                        .unwrap()
                ); //
                assert_eq!(
                    y,
                    &PoolPN::pn_from_innner_value(3998_319530769404) // from deposit test
                        .checked_add(&rez.recv_amount().amt)
                        .unwrap()
                ); //
                assert!(x.greater_than(&zero)); // some of x left in pool, because of fill_adj
            } else {
                // without liq flooring
                assert_eq!(
                    rez.send_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(1_999275547733), true)
                ); // float -1.9992755440209227_f64
                   // lesss (in abs value) than when no fill_adj : 3999999999999998
                assert_eq!(
                    rez.recv_amount(),
                    &Swp::new(PoolPN::pn_from_innner_value(4896_836754800713), false)
                ); // float 4896.836755077212_f64
                assert_eq!(
                    x,
                    &PoolPN::pn_from_innner_value(1_999275547735) // from deposit test
                        .checked_sub(&rez.send_amount().amt)
                        .unwrap()
                );
                assert_eq!(
                    y,
                    &PoolPN::pn_from_innner_value(3999_999999999998) // from deposit test
                        .checked_add(&rez.recv_amount().amt)
                        .unwrap()
                );
                assert!(x.greater_than(&zero)); // some of y left in pool, because of fill_adj
            }
        }

        assert_eq!(x_adj, &zero);
        assert_eq!(x_fee, &zero);
        assert_eq!(y_adj, &zero);
        assert_eq!(y_fee, &zero);
    }

    #[test]
    fn test_breaking_trades_y() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(2000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(1333)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000)).unwrap();
        let mut pool = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);

        pool.execute_swap_from_y(Swp::new(PoolPN::pn(6000), false), &zero);
        let (x, _, _) = pool.x_info();
        let (y, _, _) = pool.y_info();

        let mut pool_bis = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool_bis.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);

        pool_bis.execute_swap_from_y(Swp::new(PoolPN::pn(2000), false), &zero);
        pool_bis.execute_swap_from_y(Swp::new(PoolPN::pn(2000), false), &zero);
        pool_bis.execute_swap_from_y(Swp::new(PoolPN::pn(2000), false), &zero);
        let (x_bis, _, _) = pool_bis.x_info();
        let (y_bis, _, _) = pool_bis.y_info();

        // breaking up trade should be slighlty more advantageous for pool, due to rounding
        assert!(x_bis.greater_than_or_equal(&x));
        assert!(y_bis.greater_than_or_equal(&y));

        // out of liquidity
        assert_eq!(pool.glbl_liq().amt, zero);
        assert_eq!(pool.glbl_liq().neg, false);
        assert_eq!(pool_bis.glbl_liq().amt, zero);
        assert_eq!(pool_bis.glbl_liq().neg, false);

        let extra = pool.execute_swap_from_y(Swp::new(PoolPN::pn(500), false), &zero);
        let extra_bis = pool_bis.execute_swap_from_y(Swp::new(PoolPN::pn(500), false), &zero);

        // //so swapped amount shoud be zero
        assert_eq!(extra.recv_amount().amt, zero);
        assert_eq!(extra.send_amount().amt, zero);
        assert_eq!(extra_bis.recv_amount().amt, zero);
        assert_eq!(extra_bis.send_amount().amt, zero);
    }

    #[test]
    fn test_pool_starts_w_no_liq_in_range_y() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(150)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(180)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(230)).unwrap();
        let mut pool = PoolPN::new("SOL", 12, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit("dude", &PoolPN::pn(4), &PoolPN::pn(600), &rpa, &rpb);

        // no y should be have been deposited in pool, given range.
        assert!(pool.x_info().0.greater_than(&zero));
        assert_eq!(pool.y_info().0, &zero);
        assert_eq!(pool.glbl_liq().amt, zero); // no liq in range

        let rez = pool.execute_swap_from_y(Swp::new(PoolPN::pn(200), false), &zero);

        // trades executed after getting in range
        // swapped_x  < 0.0
        assert!(rez.send_amount().amt.greater_than(&zero) && rez.send_amount().neg);
        // swapped_y  > 0.0
        assert!(rez.recv_amount().amt.greater_than(&zero));
        // we should have liquidity in range after trade
        assert!(pool.glbl_liq().amt.greater_than(&zero) && !pool.glbl_liq().neg);
        // now we should have some y in the pool
        assert!(pool.y_info().0.greater_than(&zero));
        // price has moved up from start (deposit time)
        assert!(pool.glbl_rp().greater_than(&rp));
        // price still below upper bound rpb as trade didnt drain all liquidity / x reserves
        assert!(pool.glbl_rp().less_than(&rpb));

        if PoolPN::adj_whole_fill().eq(&zero) {
            assert_eq!(rez.recv_amount().amt, PoolPN::pn(200));
            // when ADJ_WHOLE_FILL set to zero, the whole demanded qty for y should be filled
        }
        if PoolPN::FLOOR_LIQ {
            // if liq.floor() is used in depost function
            assert_eq!(pool.glbl_liq().amt, PoolPN::pn(465));
        } else {
            // if liq.floor() is NOT used in depost function
            assert_eq!(
                pool.glbl_liq().amt,
                PoolPN::pn_from_innner_value(465_306818467475)
            );
        }
    }

    #[test]
    fn test_liquidity_gap_on_the_way_up() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(175)).unwrap();
        let rpa_dude = sqrt_precise(&PoolPN::pn(150)).unwrap();
        let rpb_dude = sqrt_precise(&PoolPN::pn(190)).unwrap();
        let rpa_mate = sqrt_precise(&PoolPN::pn(210)).unwrap();
        let rpb_mate = sqrt_precise(&PoolPN::pn(250)).unwrap();
        let mut pool = PoolPN::new("SOL", 12, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit(
            "dude",
            &PoolPN::pn(2),
            &PoolPN::pn(600),
            &rpa_dude,
            &rpb_dude,
        );
        pool.deposit("mate", &PoolPN::pn(3), &zero, &rpa_mate, &rpb_mate);
        // gap of liquidity between 190 and 210

        let rez = pool.execute_swap_from_y(Swp::new(PoolPN::pn(1500), false), &zero);

        // executed more Y than 'available' in first range (600)
        assert!(rez.recv_amount().amt.greater_than(&PoolPN::pn(600)));
        // but did NOT fill the whole size of swap (1500)
        assert!(rez.recv_amount().amt.less_than(&PoolPN::pn(1500)));
        // end_price did at least enter upper range (210-250) to execute
        assert!(pool
            .glbl_rp()
            .checked_pow(2)
            .unwrap()
            .greater_than(&PoolPN::pn(210)));
    }

    #[test]
    fn test_withdraw() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(200)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(174)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(250)).unwrap();
        let mut pool = PoolPN::new("SOL", 12, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        pool.deposit("dude", &PoolPN::pn(4), &PoolPN::pn(600), &rpa, &rpb);
        assert_eq!(pool.position_count(), 1);
        assert_eq!(pool.tick_count(), 2);
        assert!(pool.x_info().0.greater_than(&zero));
        assert!(pool.y_info().0.greater_than(&zero));

        let deposited = pool.glbl_liq().amt.clone();

        // no adjustements whatsoever during whole process (deposit, swap and withdrawal)
        if !PoolPN::FLOOR_LIQ
            && PoolPN::adj_withdrawal().eq(&zero)
            && PoolPN::adj_whole_fill().eq(&zero)
        {
            pool.execute_swap_from_x(Swp::new(PoolPN::pn(20), false), &zero);

            pool.withdraw("dude", &deposited, &rpa, &rpb);

            assert_eq!(pool.position_count(), 0); // no more positions
            assert_eq!(pool.tick_count(), 0); // no initialized ticks
            assert_eq!(pool.glbl_liq().amt, zero); // liq zero

            assert!(pool.x_info().0.eq(&zero));
            assert!(pool.y_info().0.eq(&zero));
            // both x and y reserves should be empty
        }

        // conservative adjustements at deposit, swap and withdrawal)
        if PoolPN::FLOOR_LIQ
            && PoolPN::adj_withdrawal().eq(&PoolPN::pn_from_innner_value(1))
            && PoolPN::adj_whole_fill().eq(&PoolPN::pn_from_innner_value(1))
        {
            assert_eq!(pool.glbl_liq().amt, PoolPN::pn(535));
            pool.execute_swap_from_x(Swp::new(PoolPN::pn(20), false), &zero);

            pool.withdraw("dude", &PoolPN::pn(535), &rpa, &rpb);

            assert_eq!(pool.position_count(), 0); // no more positions
            assert_eq!(pool.tick_count(), 0); // no initialized ticks
            assert_eq!(pool.glbl_liq().amt, zero); // liq zero

            // leftovers from rounding during swap (for y) and at withdrawal (for x),
            assert!(pool.x_info().0.greater_than(&zero));
            assert!(pool.y_info().0.greater_than(&zero));
        }
    }
}
