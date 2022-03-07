//* these test correspond to all examples in pool_hmm.iypnb
//* of the python prototype. Tests HMM mechanism, and fee mechanism

#[cfg(test)]
mod tests {

    use hydra_proto::cl_pool_pn::hydra_math_legacy::sqrt_precise;
    use hydra_proto::cl_pool_pn::*;

    #[test]
    fn test_hmm_no_fees() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(2000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(1333)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000)).unwrap();
        let hmm_c = PoolPN::pn(3).checked_div(&PoolPN::pn(2)).unwrap(); //1.5

        let mut cpmm_pool = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), zero.clone());
        cpmm_pool.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);

        let (x_a, x_adj_a, x_fee_a) = cpmm_pool.x_info();
        let (y_a, y_adj_a, y_fee_a) = cpmm_pool.y_info();

        let mut hmm_pool = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, hmm_c.clone(), zero.clone());
        hmm_pool.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);

        let (x_h, x_adj_h, x_fee_h) = hmm_pool.x_info();
        let (y_h, y_adj_h, y_fee_h) = hmm_pool.y_info();

        // no difference on deposits
        assert_eq!(x_a, x_h);
        assert_eq!(x_adj_a, x_adj_h);
        assert_eq!(x_fee_a, x_fee_h);
        assert_eq!(y_a, y_h);
        assert_eq!(y_adj_a, y_adj_h);
        assert_eq!(y_fee_a, y_fee_h);

        let rp_oracle = sqrt_precise(&PoolPN::pn(1500)).unwrap();

        let rez_a = cpmm_pool.execute_swap_from_x(Swp::new(PoolPN::pn(3), false), &rp_oracle);
        let rez_h = hmm_pool.execute_swap_from_x(Swp::new(PoolPN::pn(3), false), &rp_oracle);
        // same quantity of X swapped
        assert_eq!(rez_h.recv_amount(), rez_a.recv_amount());
        // hmm gives out less of  asset Y (smaller abs value)
        assert!(rez_h.send_amount().amt.less_than(&rez_a.send_amount().amt));
        // same end price for the pool
        assert_eq!(rez_h.end_price(), rez_a.end_price());
        // pool buying X, hmm_pool buys at cheaper avg price
        assert!(rez_h.avg_price().less_than(&rez_a.avg_price()));
        // y_adj accounts for the difference in Y given out
        assert_eq!(
            rez_h.send_hmm_adj(),
            rez_a
                .send_amount()
                .amt
                .checked_sub(&rez_h.send_amount().amt)
                .unwrap()
        );

        // post reserves are the same. hmm impact in taken out of reserves and put into adj_fee pot
        assert_eq!(hmm_pool.x_info().0, cpmm_pool.x_info().0);
        assert_eq!(hmm_pool.y_info().0, cpmm_pool.y_info().0);
        // global price and tick are the same
        assert_eq!(hmm_pool.glbl_tick(), cpmm_pool.glbl_tick());
        assert_eq!(hmm_pool.glbl_rp(), cpmm_pool.glbl_rp());

        if PoolPN::adj_whole_fill().eq(&zero) && !PoolPN::FLOOR_LIQ {
            assert_eq!(
                hmm_pool.y_info().1,
                &PoolPN::pn_from_innner_value(300_041906174890)
            ); // float 300.0419098796583_f64
            assert_eq!(
                hmm_pool.glbl_rp().checked_pow(2).unwrap(),
                PoolPN::pn_from_innner_value(1332_937253202705)
            ); // float 1332.937255554048_f64.sqrt()
            assert_eq!(
                rez_h.avg_price(),
                PoolPN::pn_from_innner_value(1510_214900363701)
            ); // float 1510.2149015898015_f64
        }
        if PoolPN::adj_whole_fill().eq(&PoolPN::pn_from_innner_value(1)) && PoolPN::FLOOR_LIQ {
            assert_eq!(
                hmm_pool.y_info().1,
                &PoolPN::pn_from_innner_value(299_915853376787)
            ); // float 299.9158574252024_f64_f64
            assert_eq!(
                hmm_pool.glbl_rp().checked_pow(2).unwrap(),
                PoolPN::pn_from_innner_value(1332_937253202705)
            ); // float 1332.937255554048_f64
            assert_eq!(
                rez_h.avg_price(),
                PoolPN::pn_from_innner_value(1510_214900362431)
            ); // float 1510.2149015898015_f64
        }

        // do another swap, from Y this time
        let rp_oracle2 = sqrt_precise(&PoolPN::pn(1700)).unwrap();
        let res_a = cpmm_pool.execute_swap_from_y(Swp::new(PoolPN::pn(3955), false), &rp_oracle2);
        let res_h = hmm_pool.execute_swap_from_y(Swp::new(PoolPN::pn(3955), false), &rp_oracle2);
        // same quantity of Y swapped
        assert_eq!(res_h.recv_amount(), res_a.recv_amount());
        // hmm gives out less of  asset X (smaller abs value)
        assert!(res_h.send_amount().amt.less_than(&res_a.send_amount().amt));
        // same end price for the pool
        assert_eq!(res_h.end_price(), res_a.end_price());
        // pool buying Y (selling X), hmm_pool sell at higher avg price
        assert!(res_h.end_price().greater_than(&res_a.avg_price()));
        // x_adj accounts for the difference in X given out
        assert_eq!(
            res_h.send_hmm_adj(),
            res_a
                .send_amount()
                .amt
                .checked_sub(&res_h.send_amount().amt)
                .unwrap()
        );

        // post reserves, global price and tick are still the same after 2 swaps
        assert_eq!(hmm_pool.x_info().0, cpmm_pool.x_info().0);
        assert_eq!(hmm_pool.y_info().0, cpmm_pool.y_info().0);
        assert_eq!(hmm_pool.glbl_tick(), cpmm_pool.glbl_tick());
        assert_eq!(hmm_pool.glbl_rp(), cpmm_pool.glbl_rp());

        if PoolPN::adj_whole_fill().eq(&zero) && !PoolPN::FLOOR_LIQ {
            assert_eq!(
                hmm_pool.x_info().1,
                &PoolPN::pn_from_innner_value(0_133871061384)
            ); // float 0.13387105926908927_f64
            assert_eq!(
                hmm_pool.y_info().1,
                &PoolPN::pn_from_innner_value(300_041906174890)
            ); // float 300.0419098796583_f64 // unchanged from 1st swap
            assert_eq!(
                hmm_pool.glbl_rp().checked_pow(2).unwrap(),
                PoolPN::pn_from_innner_value(1991_582630950117)
            ); // float 1991.582634658289_f64
            assert_eq!(
                res_h.avg_price(),
                PoolPN::pn_from_innner_value(1724_412156604956)
            ); // float 1724.4121583231515_f64
        }
        if PoolPN::adj_whole_fill().eq(&PoolPN::pn_from_innner_value(1)) && PoolPN::FLOOR_LIQ {
            assert_eq!(
                hmm_pool.x_info().1,
                &PoolPN::pn_from_innner_value(0_133814819834)
            ); // float  0.13381481787398464_f64
            assert_eq!(
                hmm_pool.y_info().1,
                &PoolPN::pn_from_innner_value(299_915853376787)
            ); // float 299.9158574252024_f64 // unchanged from 1st swap
            assert_eq!(
                hmm_pool.glbl_rp().checked_pow(2).unwrap(),
                PoolPN::pn_from_innner_value(1991_887163600312)
            ); // float 1991.8871664747417_f64
            assert_eq!(
                res_h.avg_price(),
                PoolPN::pn_from_innner_value(1724_509395610236)
            ); // float 1724.5093970632417_f64
        }
    }

    #[test]
    fn test_fees() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(2000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(1333)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000)).unwrap();
        let hmm_c = PoolPN::pn(3).checked_div(&PoolPN::pn(2)).unwrap(); // 1.5

        let x_to_swap = Swp::new(PoolPN::pn(3), false); //* use either 3 or 1
        let fee_rate = PoolPN::pn(3).checked_div(&PoolPN::pn(1000)).unwrap(); // 0.003_f64;

        let mut hmm_nofee = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, hmm_c.clone(), zero.clone());
        hmm_nofee.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);
        let x_in_pool_n = hmm_nofee.x_info().0.clone();

        let mut hmm_feed = PoolPN::new(
            "ETH",
            18,
            "USDC",
            6,
            &rp,
            1,
            hmm_c.clone(),
            fee_rate.clone(),
        );
        hmm_feed.deposit("abc", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);
        let x_in_pool_f = hmm_feed.x_info().0.clone();
        let pool_liq = hmm_feed.glbl_liq().clone();

        assert_eq!(x_in_pool_f, x_in_pool_n);

        let rp_oracle = sqrt_precise(&PoolPN::pn(1500)).unwrap();

        let rez_n = hmm_nofee.execute_swap_from_x(x_to_swap.clone(), &rp_oracle);
        let rez_f = hmm_feed.execute_swap_from_x(x_to_swap.clone(), &rp_oracle);

        if x_to_swap.amt.greater_than(&x_in_pool_n) {
            // large swap, not enough Y reserves to a
            // fee impact: more X received for same amount of Y given out
            assert!(
                rez_f
                    .recv_amount()
                    .amt
                    .greater_than(&rez_n.recv_amount().amt)
                    && rez_f.send_amount().amt.eq(&rez_n.send_amount().amt)
            );
            // same amount of Y given out ==> price impact is same
            assert!(rez_f.end_price() == rez_n.end_price());
            // x_fee accounts for the difference between (x post_swap)  and (amt sent in + x pre_swap)
            assert_eq!(
                x_in_pool_f.checked_add(&rez_f.recv_amount().amt).unwrap(),
                hmm_feed.x_info().0.checked_add(&rez_f.recv_fee()).unwrap()
            );
            assert_eq!(
                x_in_pool_n.checked_add(&rez_n.recv_amount().amt).unwrap(),
                hmm_nofee.x_info().0.checked_add(&rez_n.recv_fee()).unwrap()
            );
        } else {
            // small swap, enough Y reserves available to fill whole qty
            // fee impact: same X received for less amount of Y given out
            assert!(
                rez_f.recv_amount() == rez_n.recv_amount()
                    && rez_f.send_amount().amt.less_than(&rez_n.send_amount().amt)
            );
            // less amount of Y given out ==> price impact is smaller (falls less)
            assert!(rez_f.end_price().greater_than(&rez_n.end_price()));
            // x_fee accounts for the difference between (x post_swap)  and (amt sent in + x pre_swap)
            assert_eq!(
                x_in_pool_f.checked_add(&rez_f.recv_amount().amt).unwrap(),
                hmm_feed.x_info().0.checked_add(&rez_f.recv_fee()).unwrap()
            );
            assert_eq!(
                x_in_pool_n.checked_add(&rez_n.recv_amount().amt).unwrap(),
                hmm_nofee.x_info().0.checked_add(&rez_n.recv_fee()).unwrap()
            );
        }
        // EITHER WAY, pool buying X so with fees, pool buys at cheaper avg price
        assert!(rez_f.avg_price().less_than(&rez_n.avg_price()));

        // the fee charged is in fee pot
        assert_eq!(hmm_feed.x_info().2, &rez_f.recv_fee());
        assert_eq!(hmm_nofee.x_info().2, &rez_n.recv_fee());
        // and it is not zero
        assert!(hmm_feed.x_info().2.greater_than(&zero));
        assert!(hmm_nofee.x_info().2.eq(&zero));

        assert_eq!(
            rez_f.recv_fee(),
            rez_f.recv_amount().amt.checked_mul(&fee_rate).unwrap(),
        );

        // before withdrawal x_fee and y_adj are in the fee pots
        assert!(hmm_feed
            .x_info()
            .2
            .checked_add(&hmm_feed.y_info().1)
            .unwrap()
            .greater_than(&zero));

        if PoolPN::adj_withdrawal().greater_than(&zero) {
            hmm_feed.withdraw("abc", &pool_liq.amt, &rpa, &rpb);

            // after withdrawal, fee pots are empty (transferred to LP along with assets) ===> close to zero due to adj_withdrawal
            assert!(hmm_feed
                .x_info()
                .2
                .checked_add(&hmm_feed.y_info().1)
                .unwrap()
                .less_than(&PoolPN::pn_from_innner_value(1000)));
            assert_eq!(hmm_feed.position_count(), 0);
        }
    }

    #[test]
    fn test_no_infinite_loop() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(2000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(1333)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000)).unwrap();
        let fee_rate = PoolPN::pn(3).checked_div(&PoolPN::pn(1000)).unwrap(); // 0.003_f64;

        let mut single = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), fee_rate.clone());
        single.deposit("alice", &PoolPN::pn(2), &PoolPN::pn(4000), &rpa, &rpb);

        let rp_oracle = sqrt_precise(&PoolPN::pn(1500)).unwrap();
        let rez_single = single.execute_swap_from_x(Swp::new(PoolPN::pn(3), false), &rp_oracle);

        let mut split = PoolPN::new("ETH", 18, "USDC", 6, &rp, 1, zero.clone(), fee_rate.clone());
        split.deposit("bob", &zero, &PoolPN::pn(4000), &rpa, &rp);
        split.deposit("carl", &PoolPN::pn(2), &zero, &rp, &rpb);

        let rez_split = split.execute_swap_from_x(Swp::new(PoolPN::pn(3), false), &rp_oracle);

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
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(10000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(8000)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(12500)).unwrap();

        //+ this passes as long as fee rate above 4 basis points
        let fee_rate = PoolPN::pn(3).checked_div(&PoolPN::pn(1000)).unwrap(); // 0.003_f64;
        let mut pool = PoolPN::new("HYS", 12, "USDC", 6, &rp, 1, zero.clone(), fee_rate.clone());
        pool.deposit("aly", &PoolPN::pn(1000), &PoolPN::pn(10000000), &rpa, &rpb);

        let orig_tick = pool.glbl_tick();
        let orig_p = pool.glbl_rp().checked_pow(2).unwrap();
        let rez =
            pool.execute_swap_from_x(Swp::new(PoolPN::pn_from_innner_value(10800), false), &zero);
        let new_tick = pool.glbl_tick();
        let new_p = pool.glbl_rp().checked_pow(2).unwrap();

        // even tiniest of trades moves the needle (price) and is executed
        assert!(rez.recv_amount().amt.greater_than(&zero) && !rez.recv_amount().neg);
        assert!(rez.send_amount().amt.greater_than(&zero) && rez.send_amount().neg);
        assert!(orig_tick >= new_tick);
        assert!(orig_p.greater_than(&new_p));
        assert!(orig_p.greater_than_or_equal(&rez.avg_price())); // we buy X below orig_price
    }
    #[test]
    fn test_small_trades_y() {
        let zero = PoolPN::zero();
        let rp = sqrt_precise(&PoolPN::pn(10000)).unwrap();
        let rpa = sqrt_precise(&PoolPN::pn(8000)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(12500)).unwrap();

        //+ this passes as long as fee rate above 1 basis point
        let fee_rate = PoolPN::pn(3).checked_div(&PoolPN::pn(1000)).unwrap(); // 0.003_f64;
        let mut pool = PoolPN::new("HYS", 12, "USDC", 6, &rp, 1, zero.clone(), fee_rate.clone());
        pool.deposit("aly", &PoolPN::pn(1000), &PoolPN::pn(10000000), &rpa, &rpb);

        let orig_tick = pool.glbl_tick();
        let orig_p = pool.glbl_rp().checked_pow(2).unwrap();
        let rez =
            pool.execute_swap_from_y(Swp::new(PoolPN::pn_from_innner_value(950000), false), &zero);
        let new_tick = pool.glbl_tick();
        let new_p = pool.glbl_rp().checked_pow(2).unwrap();

        // even tiniest of trades moves the needle (price) and is executed
        assert!(rez.recv_amount().amt.greater_than(&zero) && !rez.recv_amount().neg);
        assert!(rez.send_amount().amt.greater_than(&zero) && rez.send_amount().neg);
        assert!(orig_tick <= new_tick);
        assert!(orig_p.less_than(&new_p));
        assert!(orig_p.less_than_or_equal(&rez.avg_price())); // we sell X above orig_price
    }
}
