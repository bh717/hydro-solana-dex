#[cfg(test)]
mod tests {

    use hydra_math_rs::decimal::*;
    use prototypes::cl_pool::*;

    #[test]
    fn test_tick_to_tp_to_tick() {
        let price = Decimal::from_u64(4000).to_compute_scale();
        let rp = price.sqrt().unwrap();
        let td = Pool::rp_to_tick_loop(rp, false, 0u128);
        let tu = Pool::rp_to_tick_loop(rp, true, 0u128);

        assert_eq!(td, 82944);
        assert_eq!(tu, 82945);
    }

    #[test]
    fn tick_to_possible() {
        let price = Decimal::from_u64(4000).to_compute_scale();
        let rp = price.sqrt().unwrap();

        assert_eq!(Pool::rp_to_tick_loop(rp, false, 0), 82944);
        assert_eq!(Pool::rp_to_possible_tk(rp, 30, false, 0), 82920);
        assert_eq!(Pool::rp_to_possible_tk(rp, 30, true, 0), 82950);
    }

    #[test]
    fn problem1() {
        // A user has x = 2 ETH and wants to set up a liquidity position in an ETH/USDC pool.
        // The current price of ETH is P =2000 USDC and target price range is from pa = 1500 to
        // pb = 2500 USDC. How much USDC (y) do they need?
        let x = Decimal::from_u64(2).to_compute_scale();
        let rpa = Decimal::from_u64(1500).to_compute_scale().sqrt().unwrap();
        let rp = Decimal::from_u64(2000).to_compute_scale().sqrt().unwrap();
        let rpb = Decimal::from_u64(2500).to_compute_scale().sqrt().unwrap();

        let lx = Pool::liq_x_only(x, rp, rpb);
        // in float: 847.2135954999583
        assert_eq!(lx, Decimal::new(847213595499815, COMPUTE_SCALE, false));

        let y = Pool::y_from_l_rp_rng(lx, rp, rpa, rpb);
        // in float to 5076.102359479882
        assert_eq!(y, Decimal::new(5076102359478491, COMPUTE_SCALE, false));
    }

    #[test]
    fn problem2() {
        // A user has x=2 ETH and y=4000 USDC, and wants to use pb =3000USDC perETH as the top of
        // the price range. What is the bottom of the range (pa) that ensures the opened position
        // uses the full amount of their funds?
        let x = Decimal::from_u64(2).to_compute_scale();
        let y = Decimal::from_u64(4000).to_compute_scale();
        let rp = y.div(x).sqrt().unwrap();
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        //method 1
        let rpa = Pool::rpa_from_x_y_rp_rpb(x, y, rp, rpb);
        // floats: 36.51483716701107  (=1333.3333333333333_f64.sqrt())
        assert_eq!(rpa, Decimal::new(36514837167010, COMPUTE_SCALE, false));

        // method 2
        let lx = Pool::liq_x_only(x, rp, rpb);
        let rpa_bis = Pool::rpa_from_l_rp_y(lx, rp, y);
        // floats: 36.51483716701107  (=1333.3333333333333_f64.sqrt())
        assert_eq!(rpa_bis, Decimal::new(36514837167010, COMPUTE_SCALE, false));
    }

    #[test]
    fn problem3() {
        // Using the liquidity position created in Problem 2, what are asset balances when the
        // price changes to P = 2500 USDC per ETH?
        let x = Decimal::from_u64(2).to_compute_scale();
        let y = Decimal::from_u64(4000).to_compute_scale();
        let rp_orig = y.div(x).sqrt().unwrap();
        let rp_new = Decimal::from_u64(2500).to_compute_scale().sqrt().unwrap();

        let rpa = Decimal::from_u64(4000)
            .to_compute_scale()
            .div(Decimal::from_u64(3).to_compute_scale())
            .sqrt()
            .unwrap(); // 4000/3 = 1333.3333...
        let rpb = Decimal::from_u64(3000).to_compute_scale().sqrt().unwrap();

        let l = Pool::liq_from_x_y_rp_rng(x, y, rp_orig, rpa, rpb);
        // method 1:
        let x_new = Pool::x_from_l_rp_rng(l, rp_new, rpa, rpb);
        let y_new = Pool::y_from_l_rp_rng(l, rp_new, rpa, rpb);
        // floats x_new: rust 0.8493641204744679, python 0.8493641204744687
        assert_eq!(x_new, Decimal::new(849364120474, COMPUTE_SCALE, false));
        // floats y_new: rust 6572.9000439693455", python 6572.9000439693455
        assert_eq!(y_new, Decimal::new(6572900043969071, COMPUTE_SCALE, false));

        // method 2:
        let dx = Pool::dx_from_l_drp(l, rp_orig, rp_new);
        let dy = Pool::dy_from_l_drp(l, rp_orig, rp_new);
        let x_new_bis = x.add(dx).unwrap();
        let y_new_bis = y.add(dy).unwrap();
        // float x_new_bis: 0.8493641204744686" python 0.8493641204744682 PN 849364120475
        assert_eq!(x_new_bis, Decimal::new(849364120475, COMPUTE_SCALE, false));
        assert!(x.is_positive());
        // float y_new_bis: rust 6572.900043969346 python 6572.900043969347, PN 6572900043969613
        assert_eq!(
            y_new_bis,
            Decimal::new(6572900043969612, COMPUTE_SCALE, false)
        );
        assert!(y.is_positive());
    }
}
