//* these test correspond to all examples in pool_hmm.iypnb
//* of the python prototype. Tests HMM mechanism, and fee mechanism

#[cfg(test)]
mod tests {

    use hydra_math_rs::decimal::*;
    use prototypes::cl_pool::*;

    #[test]
    fn test_hmm_no_fees() {
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

    #[test]
    fn test_fees() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(1333).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let hmm_c = Decimal::new(150, 2, false).to_compute_scale(); // 1.50

        let fee_rate = Decimal::new(30, 4, false).to_compute_scale(); // 0.003_f64 30bps

        for amt in [3u64, 1u64] {
            //* use either 3 or 1 as swapping quantity
            let x_to_swap = Decimal::from_u64(amt).to_compute_scale();

            let mut hmm_nofee = Pool::new("ETH", 18, "USDC", 6, rp, 1, hmm_c, zero);
            hmm_nofee.deposit(
                "abc",
                Decimal::from_u64(2).to_compute_scale(),
                Decimal::from_u64(4000).to_compute_scale(),
                rpa,
                rpb,
            );
            let x_in_pool_n = hmm_nofee.x_info().0;

            let mut hmm_feed = Pool::new("ETH", 18, "USDC", 6, rp, 1, hmm_c, fee_rate);
            hmm_feed.deposit(
                "abc",
                Decimal::from_u64(2).to_compute_scale(),
                Decimal::from_u64(4000).to_compute_scale(),
                rpa,
                rpb,
            );
            let x_in_pool_f = hmm_feed.x_info().0;
            let pool_liq = hmm_feed.glbl_liq();

            assert_eq!(x_in_pool_f, x_in_pool_n);

            let rp_oracle = Decimal::from_u64(1500).to_compute_scale().sqrt().unwrap();

            let rez_n = hmm_nofee.execute_swap_from_x(x_to_swap, rp_oracle);
            let rez_f = hmm_feed.execute_swap_from_x(x_to_swap, rp_oracle);

            if x_to_swap.gt(x_in_pool_n).unwrap() {
                // large swap, not enough Y reserves to a
                // fee impact: more X received for same amount of Y given out
                assert!(
                    rez_f.recv_amount().gt(rez_n.recv_amount()).unwrap()
                        && rez_f.send_amount() == (rez_n.send_amount())
                );
                // same amount of Y given out ==> price impact is same
                assert!(rez_f.end_price() == rez_n.end_price());
                // x_fee accounts for the difference between (x post_swap)  and (amt sent in + x pre_swap)
                assert_eq!(
                    x_in_pool_f.add(rez_f.recv_amount()).unwrap(),
                    hmm_feed.x_info().0.add(rez_f.recv_fee()).unwrap()
                );
                assert_eq!(
                    x_in_pool_n.add(rez_n.recv_amount()).unwrap(),
                    hmm_nofee.x_info().0.add(rez_n.recv_fee()).unwrap()
                );
            } else {
                // small swap, enough Y reserves available to fill whole qty
                // fee impact: same X received for less amount of Y given out
                assert!(
                    rez_f.recv_amount() == rez_n.recv_amount()
                        && rez_f.send_amount().value < rez_n.send_amount().value
                );
                // less amount of Y given out ==> price impact is smaller (falls less)
                assert!(rez_f.end_price().gt(rez_n.end_price()).unwrap());
                // x_fee accounts for the difference between (x post_swap)  and (amt sent in + x pre_swap)
                assert_eq!(
                    x_in_pool_f.add(rez_f.recv_amount()).unwrap(),
                    hmm_feed.x_info().0.add(rez_f.recv_fee()).unwrap()
                );
                assert_eq!(
                    x_in_pool_n.add(rez_n.recv_amount()).unwrap(),
                    hmm_nofee.x_info().0.add(rez_n.recv_fee()).unwrap()
                );
            }
            // EITHER WAY, pool buying X so with fees, pool buys at cheaper avg price
            assert!(rez_f.avg_price().lt(rez_n.avg_price()).unwrap());

            // the fee charged is in fee pot
            assert_eq!(hmm_feed.x_info().2, rez_f.recv_fee());
            assert_eq!(hmm_nofee.x_info().2, rez_n.recv_fee());
            // and it is not zero
            assert!(hmm_feed.x_info().2.is_positive());
            assert!(hmm_nofee.x_info().2.is_zero());

            assert_eq!(rez_f.recv_fee(), rez_f.recv_amount().mul(fee_rate),);

            // before withdrawal x_fee and y_adj are in the fee pots
            assert!(hmm_feed
                .x_info()
                .2
                .add(hmm_feed.y_info().1)
                .unwrap()
                .is_positive());

            if Pool::adj_withdrawal().is_positive() {
                hmm_feed.withdraw("abc", pool_liq, rpa, rpb);

                // after withdrawal, fee pots are empty (transferred to LP along with assets) ===> close to zero due to adj_withdrawal
                assert!(hmm_feed
                    .x_info()
                    .2
                    .add(hmm_feed.y_info().1)
                    .unwrap()
                    .lt(Decimal::new(1000, COMPUTE_SCALE, false))
                    .unwrap());
                assert_eq!(hmm_feed.position_count(), 0);
            } else {
                // TODO explore if can make it work w.o. adjustment
                // hmm_feed.withdraw("abc", pool_liq, rpa, rpb);
                // // after withdrawal, fee pots are empty (transferred to LP along with assets)
                // assert!(hmm_feed
                //     .x_info()
                //     .2
                //     .add(hmm_feed.y_info().1)
                //     .unwrap()
                //     .is_zero());
            }
        }
    }

    #[test]
    fn test_no_infinite_loop() {
        let zero = Pool::zero();

        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(1333).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let fee_rate = Decimal::new(30, 4, false).to_compute_scale(); // 0.003_f64 30bps

        let mut single = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, fee_rate);

        single.deposit(
            "alice",
            Decimal::from_u64(2).to_compute_scale(),
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rpb,
        );
        let rp_oracle = Decimal::from_u64(1500).to_compute_scale().sqrt().unwrap();

        let rez_single =
            single.execute_swap_from_x(Decimal::from_u64(3).to_compute_scale(), rp_oracle);

        let mut split = Pool::new("ETH", 18, "USDC", 6, rp, 1, zero, fee_rate);
        split.deposit(
            "bob",
            zero,
            Decimal::from_u64(4000).to_compute_scale(),
            rpa,
            rp,
        );
        split.deposit(
            "carl",
            Decimal::from_u64(2).to_compute_scale(),
            zero,
            rp,
            rpb,
        );

        let rez_split =
            split.execute_swap_from_x(Decimal::from_u64(3).to_compute_scale(), rp_oracle);

        // whether liquidity is provided in one interval or 2 adjacents intervals makes no diff to swap_from_x
        // here deposited amount in x in sligthly different due to:
        //  _ in 'single', liq_x_only and liq_y_only are compared and the min is taken (in this case liq_y_only is taken)
        //  _ in 'split' no comparaison is done so input x & y taken in as given
        // in this case X reserves are slightly different
        // but this doesnt affect the result on a swap_from_x
        assert_eq!(rez_single, rez_split);
    }

    #[test]
    fn test_small_trades_x() {
        let zero = Pool::zero();
        let rp = Decimal::from_u64(10000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(8000).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(12500).to_compute_scale().sqrt().unwrap();

        //+ this passes as long as fee rate 3 bps or above (vs above 4 basis points with PreciseNumber)
        let fee_rate = Decimal::new(30, 4, false).to_compute_scale(); // 0.003_f64 30bps

        let mut pool = Pool::new("HYS", 12, "USDC", 6, rp, 1, zero, fee_rate);

        pool.deposit(
            "aly",
            Decimal::from_u64(1000).to_compute_scale(),
            Decimal::from_u64(10000000).to_compute_scale(),
            rpa,
            rpb,
        );

        //+ passes as long as swap quantity is 10800 * 10^-12 or above
        let orig_tick = pool.glbl_tick();
        let orig_price = pool.glbl_rp().pow(2);
        let rez = pool.execute_swap_from_x(Decimal::new(10800, 12, false), zero);
        let new_tick = pool.glbl_tick();
        let new_price = pool.glbl_rp().pow(2);

        // even a tiny trade moves the needle (price) and is executed
        assert!(rez.recv_amount().is_positive());
        assert!(rez.send_amount().is_negative());
        assert!(orig_tick >= new_tick);
        assert!(orig_price.gt(new_price).unwrap()); // price goes down as pool receives X
        assert!(orig_price.gte(rez.avg_price()).unwrap()); // pool buys X below orig_price on average
    }

    #[test]
    fn test_small_trades_y() {
        let zero = Pool::zero();
        let x = Decimal {
            value: 999577539060928,
            scale: COMPUTE_SCALE,
            negative: false,
        };
        let y = Decimal {
            value: 9999999999999999992,
            scale: COMPUTE_SCALE,
            negative: false,
        };
        let rp = y.div(x).sqrt().unwrap();

        // let rp = Decimal::from_u64(10000).to_compute_scale().sqrt().unwrap();
        let rpa = Decimal::from_u64(8000).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(12500).to_compute_scale().sqrt().unwrap();

        let fee_rate = Decimal::new(30, 4, false).to_compute_scale(); // 0.003_f64 30bps

        let mut pool = Pool::new("HYS", 12, "USDC", 6, rp, 1, zero, fee_rate);

        pool.deposit(
            "aly",
            Decimal::from_u64(1000).to_compute_scale(),
            Decimal::from_u64(10000000).to_compute_scale(),
            rpa,
            rpb,
        );

        let orig_tick = pool.glbl_tick();
        let orig_p = pool.glbl_rp().pow(2);

        //+ this passes as long as swap quantity is gte 950000*10^-12
        //+ else send_amount() becomes nil --> panic

        let rez = pool.execute_swap_from_y(Decimal::new(950000, 12, false), zero);
        let new_tick = pool.glbl_tick();
        let new_p = pool.glbl_rp().pow(2);

        // even a tiny trade moves the needle (price) and is executed
        assert!(rez.recv_amount().is_positive());
        assert!(rez.send_amount().is_negative());
        assert!(orig_tick <= new_tick);
        assert!(orig_p.lt(new_p).unwrap());
        assert!(orig_p.lte(rez.avg_price()).unwrap()); // we sell X above orig_price
    }
}
