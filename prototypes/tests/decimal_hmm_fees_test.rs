//* these test correspond to all examples in pool_hmm.iypnb
//* of the python prototype. Tests HMM mechanism, and fee mechanism

#[cfg(test)]
mod tests {

    use hydra_math_rs::decimal::*;
    use prototypes::cl_pool::*;

    #[test]
    fn test_hmm_no_fees() {
        let zero = Pool::zero();
        let zero = Pool::zero();
        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(1333).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let hmm_c = Decimal::new(150, 2, false).to_compute_scale(); // 1.5

        let mut cpmm_pool = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, zero);

        cpmm_pool.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );

        let (x_a, x_adj_a, x_fee_a) = cpmm_pool.x_info();
        let (y_a, y_adj_a, y_fee_a) = cpmm_pool.y_info();

        let mut hmm_pool = Pool::new("ETH", 18, "USDC", 6, rp, 1, hmm_c, zero);

        hmm_pool.deposit(
            "abc",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );

        let (x_h, x_adj_h, x_fee_h) = hmm_pool.x_info();
        let (y_h, y_adj_h, y_fee_h) = hmm_pool.y_info();

        // no difference on deposits
        assert_eq!(x_a, x_h);
        assert_eq!(x_adj_a, x_adj_h);
        assert_eq!(x_fee_a, x_fee_h);
        assert_eq!(y_a, y_h);
        assert_eq!(y_adj_a, y_adj_h);
        assert_eq!(y_fee_a, y_fee_h);

        let rp_oracle = Decimal::from_u64(1500).to_compute_scale().sqrt().unwrap();

        let rez_a =
            cpmm_pool.execute_swap_from_x(Decimal::from_u64(3).to_compute_scale(), rp_oracle);
        let rez_h =
            hmm_pool.execute_swap_from_x(Decimal::from_u64(3).to_compute_scale(), rp_oracle);
        // same quantity of X swapped
        assert_eq!(rez_h.recv_amount(), rez_a.recv_amount());
        // hmm gives out less of  asset Y (smaller abs value)
        assert!(rez_h.send_amount().value < rez_a.send_amount().value);
        // same end price for the pool
        assert_eq!(rez_h.end_price(), rez_a.end_price());
        // pool buying X, hmm_pool buys at cheaper avg price
        assert!(rez_h.avg_price().lt(rez_a.avg_price()).unwrap());
        // y_adj accounts for the difference in Y given out
        assert_eq!(
            rez_h.send_hmm_adj(),
            rez_h.send_amount().sub(rez_a.send_amount()).unwrap()
        );

        // post reserves are the same. hmm impact in taken out of reserves and put into adj_fee pot
        assert_eq!(hmm_pool.x_info().0, cpmm_pool.x_info().0);
        assert_eq!(hmm_pool.y_info().0, cpmm_pool.y_info().0);
        // global price and tick are the same
        assert_eq!(hmm_pool.glbl_tick(), cpmm_pool.glbl_tick());
        assert_eq!(hmm_pool.glbl_rp(), cpmm_pool.glbl_rp());

        assert_eq!(
            hmm_pool.y_info().1,
            Decimal::new(300_041649746282, COMPUTE_SCALE, false)
        ); // float 300.0419098796583_f64 PN 300_041906174890
        assert_eq!(
            hmm_pool.glbl_rp().pow(2),
            Decimal::new(1332_937085253129, COMPUTE_SCALE, false)
        ); // float 1332.937255554048_f64 PN 1332_937253202705
        assert_eq!(
            rez_h.avg_price(),
            Decimal::new(1510_214809376886, COMPUTE_SCALE, false)
        ); // float 1510.2149015898015_f64 PN 1510_214900363701

        // do another swap, from Y this time
        let rp_oracle2 = Decimal::from_u64(1700).to_compute_scale().sqrt().unwrap();
        let res_a =
            cpmm_pool.execute_swap_from_y(Decimal::from_u64(3955).to_compute_scale(), rp_oracle2);
        let res_h =
            hmm_pool.execute_swap_from_y(Decimal::from_u64(3955).to_compute_scale(), rp_oracle2);
        // same quantity of Y swapped
        assert_eq!(res_h.recv_amount(), res_a.recv_amount());
        // hmm gives out less of  asset X (smaller abs value)
        assert!(res_h.send_amount().value < res_a.send_amount().value);
        // same end price for the pool
        assert_eq!(res_h.end_price(), res_a.end_price());
        // pool buying Y (selling X), hmm_pool sell at higher avg price
        assert!(res_h.end_price().gt(res_a.avg_price()).unwrap());
        // x_adj accounts for the difference in X given out
        assert_eq!(
            res_h.send_hmm_adj(),
            res_h.send_amount().sub(res_a.send_amount()).unwrap()
        );

        // post reserves, global price and tick are still the same after 2 swaps
        assert_eq!(hmm_pool.x_info().0, cpmm_pool.x_info().0);
        assert_eq!(hmm_pool.y_info().0, cpmm_pool.y_info().0);
        assert_eq!(hmm_pool.glbl_tick(), cpmm_pool.glbl_tick());
        assert_eq!(hmm_pool.glbl_rp(), cpmm_pool.glbl_rp());

        assert_eq!(
            hmm_pool.x_info().1,
            Decimal::new(0_133871212606, COMPUTE_SCALE, false)
        ); // float 0.13387105926908927_f64 PN 0_133871061384
        assert_eq!(
            hmm_pool.y_info().1,
            Decimal::new(300_041649746282, COMPUTE_SCALE, false)
        ); // float 300.0419098796583_f64 PN 300_041906174890// unchanged from 1st swap
        assert_eq!(
            hmm_pool.glbl_rp().pow(2),
            Decimal::new(1991_582365986590, COMPUTE_SCALE, false)
        ); // float 1991.582634658289_f64 PN 1991_582630950117
        assert_eq!(
            res_h.avg_price(),
            Decimal::new(1724_412033919077, COMPUTE_SCALE, false)
        ); // float 1724.4121583231515_f64 PN 1724_412156604956
    }

    // #[test]
    // fn test_fees() {
    //     let zero = Pool::zero();
    //     let rp = sqrt_precise(&Pool::pn(2000)).unwrap();
    //     let rpa = sqrt_precise(&Pool::pn(1333)).unwrap();
    //     let rpb = sqrt_precise(&Pool::pn(3000)).unwrap();
    //     let hmm_c = Pool::pn(3).checked_div(&Pool::pn(2)).unwrap(); // 1.5

    //     let x_to_swap = Swp::new(Pool::pn(3), false); //* use either 3 or 1
    //     let fee_rate = Pool::pn(3).checked_div(&Pool::pn(1000)).unwrap(); // 0.003_f64;

    //     let mut hmm_nofee = Pool::new("ETH", 18, "USDC", 6, &rp, 1, hmm_c.clone(), zero.clone());
    //     hmm_nofee.deposit("abc", &Pool::pn(2), &Pool::pn(4000), &rpa, &rpb);
    //     let x_in_pool_n = hmm_nofee.x_info().0.clone();

    //     let mut hmm_feed = Pool::new(
    //         "ETH",
    //         18,
    //         "USDC",
    //         6,
    //         &rp,
    //         1,
    //         hmm_c.clone(),
    //         fee_rate.clone(),
    //     );
    //     hmm_feed.deposit("abc", &Pool::pn(2), &Pool::pn(4000), &rpa, &rpb);
    //     let x_in_pool_f = hmm_feed.x_info().0.clone();
    //     let pool_liq = hmm_feed.glbl_liq().clone();

    //     assert_eq!(x_in_pool_f, x_in_pool_n);

    //     let rp_oracle = sqrt_precise(&Pool::pn(1500)).unwrap();

    //     let rez_n = hmm_nofee.execute_swap_from_x(x_to_swap.clone(), &rp_oracle);
    //     let rez_f = hmm_feed.execute_swap_from_x(x_to_swap.clone(), &rp_oracle);

    //     if x_to_swap.amt.greater_than(&x_in_pool_n) {
    //         // large swap, not enough Y reserves to a
    //         // fee impact: more X received for same amount of Y given out
    //         assert!(
    //             rez_f
    //                 .recv_amount()
    //                 .amt
    //                 .greater_than(&rez_n.recv_amount().amt)
    //                 && rez_f.send_amount().amt.eq(&rez_n.send_amount().amt)
    //         );
    //         // same amount of Y given out ==> price impact is same
    //         assert!(rez_f.end_price() == rez_n.end_price());
    //         // x_fee accounts for the difference between (x post_swap)  and (amt sent in + x pre_swap)
    //         assert_eq!(
    //             x_in_pool_f.checked_add(&rez_f.recv_amount().amt).unwrap(),
    //             hmm_feed.x_info().0.checked_add(&rez_f.recv_fee()).unwrap()
    //         );
    //         assert_eq!(
    //             x_in_pool_n.checked_add(&rez_n.recv_amount().amt).unwrap(),
    //             hmm_nofee.x_info().0.checked_add(&rez_n.recv_fee()).unwrap()
    //         );
    //     } else {
    //         // small swap, enough Y reserves available to fill whole qty
    //         // fee impact: same X received for less amount of Y given out
    //         assert!(
    //             rez_f.recv_amount() == rez_n.recv_amount()
    //                 && rez_f.send_amount().amt.less_than(&rez_n.send_amount().amt)
    //         );
    //         // less amount of Y given out ==> price impact is smaller (falls less)
    //         assert!(rez_f.end_price().greater_than(&rez_n.end_price()));
    //         // x_fee accounts for the difference between (x post_swap)  and (amt sent in + x pre_swap)
    //         assert_eq!(
    //             x_in_pool_f.checked_add(&rez_f.recv_amount().amt).unwrap(),
    //             hmm_feed.x_info().0.checked_add(&rez_f.recv_fee()).unwrap()
    //         );
    //         assert_eq!(
    //             x_in_pool_n.checked_add(&rez_n.recv_amount().amt).unwrap(),
    //             hmm_nofee.x_info().0.checked_add(&rez_n.recv_fee()).unwrap()
    //         );
    //     }
    //     // EITHER WAY, pool buying X so with fees, pool buys at cheaper avg price
    //     assert!(rez_f.avg_price().less_than(&rez_n.avg_price()));

    //     // the fee charged is in fee pot
    //     assert_eq!(hmm_feed.x_info().2, &rez_f.recv_fee());
    //     assert_eq!(hmm_nofee.x_info().2, &rez_n.recv_fee());
    //     // and it is not zero
    //     assert!(hmm_feed.x_info().2.greater_than(&zero));
    //     assert!(hmm_nofee.x_info().2.eq(&zero));

    //     assert_eq!(
    //         rez_f.recv_fee(),
    //         rez_f.recv_amount().amt.checked_mul(&fee_rate).unwrap(),
    //     );

    //     // before withdrawal x_fee and y_adj are in the fee pots
    //     assert!(hmm_feed
    //         .x_info()
    //         .2
    //         .checked_add(&hmm_feed.y_info().1)
    //         .unwrap()
    //         .greater_than(&zero));

    //     if Pool::adj_withdrawal().greater_than(&zero) {
    //         hmm_feed.withdraw("abc", &pool_liq.amt, &rpa, &rpb);

    //         // after withdrawal, fee pots are empty (transferred to LP along with assets) ===> close to zero due to adj_withdrawal
    //         assert!(hmm_feed
    //             .x_info()
    //             .2
    //             .checked_add(&hmm_feed.y_info().1)
    //             .unwrap()
    //             .less_than(&Pool::pn_from_innner_value(1000)));
    //         assert_eq!(hmm_feed.position_count(), 0);
    //     }
    // }

    // #[test]
    // fn test_no_infinite_loop() {
    //     let zero = Pool::zero();
    //     let rp = sqrt_precise(&Pool::pn(2000)).unwrap();
    //     let rpa = sqrt_precise(&Pool::pn(1333)).unwrap();
    //     let rpb = sqrt_precise(&Pool::pn(3000)).unwrap();
    //     let fee_rate = Pool::pn(3).checked_div(&Pool::pn(1000)).unwrap(); // 0.003_f64;

    //     let mut single = Pool::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), fee_rate.clone());
    //     single.deposit("alice", &Pool::pn(2), &Pool::pn(4000), &rpa, &rpb);

    //     let rp_oracle = sqrt_precise(&Pool::pn(1500)).unwrap();
    //     let rez_single = single.execute_swap_from_x(Swp::new(Pool::pn(3), false), &rp_oracle);

    //     let mut split = Pool::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), fee_rate.clone());
    //     split.deposit("bob", &zero, &Pool::pn(4000), &rpa, &rp);
    //     split.deposit("carl", &Pool::pn(2), &zero, &rp, &rpb);

    //     let rez_split = split.execute_swap_from_x(Swp::new(Pool::pn(3), false), &rp_oracle);

    //     // whether liquidity is provided in one interval or 2 adjacents intervals makes no diff to swap_from_x
    //     // here deposited amount in x in sligthly different due to:
    //     //  _ in 'single', liq_x_only and liq_y_only are compared and the min is taken (in this case liq_y_only is taken)
    //     //  _ in 'split' no comparaison is done so input x & y taken in as given
    //     // in this case X reserves are slightly different
    //     // but this doesnt affect the result on a swap_from_x
    //     assert_eq!(rez_single, rez_split);
    // }

    // #[test]
    // fn test_small_trades_x() {
    //     let zero = Pool::zero();
    //     let rp = sqrt_precise(&Pool::pn(10000)).unwrap();
    //     let rpa = sqrt_precise(&Pool::pn(8000)).unwrap();
    //     let rpb = sqrt_precise(&Pool::pn(12500)).unwrap();

    //     //+ this passes as long as fee rate above 4 basis points
    //     let fee_rate = Pool::pn(3).checked_div(&Pool::pn(1000)).unwrap(); // 0.003_f64;
    //     let mut pool = Pool::new("HYS", 12, "USDC", 6, &rp, 1, zero.clone(), fee_rate.clone());
    //     pool.deposit("aly", &Pool::pn(1000), &Pool::pn(10000000), &rpa, &rpb);

    //     let orig_tick = pool.glbl_tick();
    //     let orig_p = pool.glbl_rp().checked_pow(2).unwrap();
    //     let rez =
    //         pool.execute_swap_from_x(Swp::new(Pool::pn_from_innner_value(10800), false), &zero);
    //     let new_tick = pool.glbl_tick();
    //     let new_p = pool.glbl_rp().checked_pow(2).unwrap();

    //     // even tiniest of trades moves the needle (price) and is executed
    //     assert!(rez.recv_amount().amt.greater_than(&zero) && !rez.recv_amount().neg);
    //     assert!(rez.send_amount().amt.greater_than(&zero) && rez.send_amount().neg);
    //     assert!(orig_tick >= new_tick);
    //     assert!(orig_p.greater_than(&new_p));
    //     assert!(orig_p.greater_than_or_equal(&rez.avg_price())); // we buy X below orig_price
    // }
    // #[test]
    // fn test_small_trades_y() {
    //     let zero = Pool::zero();
    //     let rp = sqrt_precise(&Pool::pn(10000)).unwrap();
    //     let rpa = sqrt_precise(&Pool::pn(8000)).unwrap();
    //     let rpb = sqrt_precise(&Pool::pn(12500)).unwrap();

    //     //+ this passes as long as fee rate above 1 basis point
    //     let fee_rate = Pool::pn(3).checked_div(&Pool::pn(1000)).unwrap(); // 0.003_f64;
    //     let mut pool = Pool::new("HYS", 12, "USDC", 6, &rp, 1, zero.clone(), fee_rate.clone());
    //     pool.deposit("aly", &Pool::pn(1000), &Pool::pn(10000000), &rpa, &rpb);

    //     let orig_tick = pool.glbl_tick();
    //     let orig_p = pool.glbl_rp().checked_pow(2).unwrap();
    //     let rez =
    //         pool.execute_swap_from_y(Swp::new(Pool::pn_from_innner_value(950000), false), &zero);
    //     let new_tick = pool.glbl_tick();
    //     let new_p = pool.glbl_rp().checked_pow(2).unwrap();

    //     // even tiniest of trades moves the needle (price) and is executed
    //     assert!(rez.recv_amount().amt.greater_than(&zero) && !rez.recv_amount().neg);
    //     assert!(rez.send_amount().amt.greater_than(&zero) && rez.send_amount().neg);
    //     assert!(orig_tick <= new_tick);
    //     assert!(orig_p.less_than(&new_p));
    //     assert!(orig_p.less_than_or_equal(&rez.avg_price())); // we sell X above orig_price
    // }
}
