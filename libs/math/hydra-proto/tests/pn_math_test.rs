#[cfg(test)]
mod tests {

    use hydra_proto::cl_pool_pn::hydra_math_legacy::{signed_addition, sqrt_precise};
    use hydra_proto::cl_pool_pn::*;
    use spl_math::precise_number::PreciseNumber;

    #[test]
    fn test_sqrt_precise_max() {
        println!("testing sqrt");

        println!(
            "precise: {:?}",
            sqrt_precise(&PreciseNumber::new(2).unwrap()).unwrap()
        );
        println!("float: {:?}", 2f64.sqrt());

        println!("u128::MAX precise: {:?}", std::u128::MAX);
        println!(
            "u128::MAX float: {:?}",
            sqrt_precise(&PreciseNumber::new(std::u128::MAX).unwrap()).unwrap()
        );
    }

    #[test]
    fn test_pseudo_constants() {
        let tb = PoolPN::tick_base();
        let _adj_wd = PoolPN::adj_withdrawal();
        let _adj_fill = PoolPN::adj_whole_fill();
        assert_eq!(tb, PoolPN::pn_from_innner_value(1_0001_0000_0000));
        // assert_eq!(adj_wd, PoolPN::pn_from_innner_value(1)); // default to zero
        // assert_eq!(adj_fill, PoolPN::pn_from_innner_value(1)); // default to zero
    }

    #[test]
    fn test_tick_to_tp_to_tick() {
        let x = 4000_u128;
        let nbr = PreciseNumber::new(x).unwrap();
        let rp = sqrt_precise(&nbr).unwrap();
        // let sqrt_x_float = (x as f64).sqrt();
        let td = PoolPN::rp_to_tick_loop(&rp, false, 0u128);
        let tu = PoolPN::rp_to_tick_loop(&rp, true, 0u128);

        // println!("td: {:?} vs {}", td, Pool::rp_to_tick(sqrt_x_float, false));
        // println!("tu: {:?} vs {}", tu, Pool::rp_to_tick(sqrt_x_float, true));
        assert_eq!(td, 82944);
        assert_eq!(tu, 82945);
    }

    #[test]
    fn tick_to_possible() {
        let rp = sqrt_precise(&PoolPN::pn(4000_u128)).unwrap();
        assert_eq!(PoolPN::rp_to_tick_loop(&rp, false, 0u128), 82944);
        assert_eq!(PoolPN::rp_to_possible_tk(&rp, 30_u128, false, 0u128), 82920);
        assert_eq!(PoolPN::rp_to_possible_tk(&rp, 30_u128, true, 0u128), 82950);
    }

    #[test]
    fn problem1() {
        // A user has x = 2 ETH and wants to set up a liquidity position in an ETH/USDC pool.
        // The current price of ETH is P =2000 USDC and target price range is from pa = 1500 to
        // pb = 2500 USDC. How much USDC (y) do they need?
        let x = PoolPN::pn(2u128);
        let rpa = sqrt_precise(&PoolPN::pn(1500u128)).unwrap();
        let rp = sqrt_precise(&PoolPN::pn(2000u128)).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(2500u128)).unwrap();

        let lx = PoolPN::liq_x_only(&x, &rp, &rpb);
        // println!("lx: {:?} comp to 847.2135954999583", lx);
        assert_eq!(lx, PoolPN::pn_from_innner_value(847213595499815));

        let y = PoolPN::y_from_l_rp_rng(&lx, &rp, &rpa, &rpb);
        // println!("y: {:?} comp to 5076.102359479882", y);
        assert_eq!(y, PoolPN::pn_from_innner_value(5076102359478491));
    }

    #[test]
    fn problem2() {
        // A user has x=2 ETH and y=4000 USDC, and wants to use pb =3000USDC perETH as the top of
        // the price range. What is the bottom of the range (pa) that ensures the opened position
        // uses the full amount of their funds?
        let (x, y) = (PoolPN::pn(2u128), PoolPN::pn(4000u128));
        let rp = sqrt_precise(&y.checked_div(&x).unwrap()).unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000u128)).unwrap();

        //method 1
        let rpa = PoolPN::rpa_from_x_y_rp_rpb(&x, &y, &rp, &rpb);
        // println!("rpa method 1: {:?} comp to {}",rpa,1333.3333333333333_f64.sqrt());
        assert_eq!(rpa, PoolPN::pn_from_innner_value(36514837167010));

        // method 2
        let lx = PoolPN::liq_x_only(&x, &rp, &rpb);
        let rpa_bis = PoolPN::rpa_from_l_rp_y(&lx, &rp, &y);
        // println!("rpa method 2: {:?} comp to {}",rpa_bis, 1333.3333333333333_f64.sqrt());
        assert_eq!(rpa_bis, PoolPN::pn_from_innner_value(36514837167010));
    }

    #[test]
    fn problem3() {
        // Using the liquidity position created in Problem 2, what are asset balances when the
        // price changes to P = 2500 USDC per ETH?
        let (x, y) = (PoolPN::pn(2u128), PoolPN::pn(4000u128));
        let rp_orig = sqrt_precise(&y.checked_div(&x).unwrap()).unwrap();
        let rp_new = sqrt_precise(&PoolPN::pn(2500u128)).unwrap();
        let rpa = sqrt_precise(
            &PoolPN::pn(4000u128)
                .checked_div(&PoolPN::pn(3u128))
                .unwrap(),
        )
        .unwrap();
        let rpb = sqrt_precise(&PoolPN::pn(3000u128)).unwrap();

        let l = PoolPN::liq_from_x_y_rp_rng(&x, &y, &rp_orig, &rpa, &rpb);
        //method 1:
        let x_new = PoolPN::x_from_l_rp_rng(&l, &rp_new, &rpa, &rpb);
        let y_new = PoolPN::y_from_l_rp_rng(&l, &rp_new, &rpa, &rpb);
        // println!("x_new: {:?} comp to  0.8493641204744679", x_new); // python 0.8493641204744687
        assert_eq!(x_new, PoolPN::pn_from_innner_value(849364120474));
        // println!("y_new: {:?} comp to 6572.9000439693455", y_new); // python 6572.9000439693455
        assert_eq!(y_new, PoolPN::pn_from_innner_value(6572900043969071));

        // method 2:
        let (dx, dx_sign) = PoolPN::dx_from_l_drp(&l, &rp_orig, &rp_new);
        let (dy, dy_sign) = PoolPN::dy_from_l_drp(&l, &rp_orig, &rp_new);
        let (x_new_bis, xns) = signed_addition(&x, false, &dx, dx_sign);
        let (y_new_bis, yns) = signed_addition(&y, false, &dy, dy_sign);
        // println!("x_new_bis: {:?} comp to  0.8493641204744686", x_new_bis); // python 0.8493641204744682
        assert_eq!(x_new_bis, PoolPN::pn_from_innner_value(849364120475));
        assert_eq!(xns, false);
        // println!("y_new_bis: {:?} comp to  6572.900043969346", y_new_bis); // python 6572.900043969347
        assert_eq!(y_new_bis, PoolPN::pn_from_innner_value(6572900043969613));
        assert_eq!(yns, false);
    }
}
