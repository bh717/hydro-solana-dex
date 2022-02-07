use spl_math::precise_number::PreciseNumber;

pub struct Calculator {
    value: u128,
}

impl Calculator {
    pub fn new(value: u128) -> Self {
        Self { value }
    }

    pub fn most_signficant_bit(&self) -> u128 {
        println!("msb leading zeros {}", self.value.leading_zeros());
        127u128 - self.value.leading_zeros() as u128
    }

    pub fn most_signficant_bit_precise(&self) -> u128 {
        // testing a more efficient way of calculating bit_length
        let precise_value = PreciseNumber::new(self.value).unwrap();
        println!(
            "msb_p leading zeros {}",
            precise_value.value.leading_zeros()
        );
        255u128 - precise_value.value.leading_zeros() as u128
    }

    /// 128-bit number length
    /// Returns the number of bits necessary to represent an integer in binary,
    /// excluding the sign and leading zeros.
    pub fn bit_length(&self, s: u128) -> u32 {
        let mut high = 128u32;
        let mut low = 0u32;
        let mut mid = (high + low) >> 1;
        loop {
            let remind = s >> mid;
            if remind > 1 {
                low = mid;
                mid = (low + high) >> 1;
                continue;
            }
            if remind == 1 {
                return mid + 1;
            }
            if remind < 1 {
                high = mid;
                mid = (low + high) >> 1;
                continue;
            }
        }
    }

    /// Legacy natural log function
    pub fn log(&self, s: u128) -> PreciseNumber {
        let log_arr_1: [u32; 10] = [
            0, 9531017, 18232155, 26236426, 33647223, 40546510, 47000362, 53062825, 58778666,
            64185388,
        ];
        let log_arr_2: [u32; 10] = [
            0, 995033, 1980262, 2955880, 3922071, 4879016, 5826890, 6765864, 7696104, 8617769,
        ];
        let log_arr_3: [u32; 10] = [
            0, 99950, 199800, 299550, 399202, 498754, 598207, 697561, 796816, 895974,
        ];
        let log_arr_4: [u32; 10] = [
            0, 9999, 19998, 29995, 39992, 49987, 59982, 69975, 79968, 89959,
        ];
        let log_arr_5: [u32; 10] = [0, 999, 1999, 2999, 3999, 4999, 5999, 6999, 7999, 8999];
        let log_arr_6: [u32; 10] = [0, 99, 199, 299, 399, 499, 599, 699, 799, 899];
        let multiply = PreciseNumber::new(100_000_000u128).unwrap();
        let length = self.bit_length(s) - 1;
        let approximate = 1u128 << length;
        let s_mul_100_000_000 = s * 100_000_000u128;
        let s0 = s_mul_100_000_000 / approximate;
        let s1 = s0 * 10 / (s0 / 10000000);
        let index_1 = (s0 / 10000000 - 10) as usize;
        let s2 = s1 * 100 / (s1 / 1000000);
        let index_2 = (s1 / 1000000 - 100) as usize;
        let s3 = s2 * 1000 / (s2 / 100000);
        let index_3 = (s2 / 100000 - 1000) as usize;
        let s4 = s3 * 10000 / (s3 / 10000);
        let index_4 = (s3 / 10000 - 10000) as usize;
        let s5 = s4 * 100000 / (s4 / 1000);
        let index_5 = (s4 / 1000 - 100000) as usize;
        let index_6 = (s5 / 100 - 1000000) as usize;
        let lnx1 = log_arr_1[index_1] as u128;
        let lnx2 = log_arr_2[index_2] as u128;
        let lnx3 = log_arr_3[index_3] as u128;
        let lnx4 = log_arr_4[index_4] as u128;
        let lnx5 = log_arr_5[index_5] as u128;
        let lnx6 = log_arr_6[index_6] as u128;
        let lnn2 = 69314718 * (length as u128);
        let tmp_result = lnn2 + lnx1 + lnx2 + lnx3 + lnx4 + lnx5 + lnx6;
        let result = PreciseNumber::new(tmp_result)
            .unwrap()
            .checked_div(&multiply)
            .unwrap();
        return result;
    }

    pub fn log_clearer(&self, s: u128) -> PreciseNumber {
        let log_arr_1: [u32; 10] = [
            0, 9531017, 18232155, 26236426, 33647223, 40546510, 47000362, 53062825, 58778666,
            64185388,
        ];
        let log_arr_2: [u32; 10] = [
            0, 995033, 1980262, 2955880, 3922071, 4879016, 5826890, 6765864, 7696104, 8617769,
        ];
        let log_arr_3: [u32; 10] = [
            0, 99950, 199800, 299550, 399202, 498754, 598207, 697561, 796816, 895974,
        ];
        let log_arr_4: [u32; 10] = [
            0, 9999, 19998, 29995, 39992, 49987, 59982, 69975, 79968, 89959,
        ];
        let log_arr_5: [u32; 10] = [0, 999, 1999, 2999, 3999, 4999, 5999, 6999, 7999, 8999];
        let log_arr_6: [u32; 10] = [0, 99, 199, 299, 399, 499, 599, 699, 799, 899];

        let multiply = PreciseNumber::new(100_000_000u128).unwrap();

        // 'approx' is the closest multiple of 2, that is below our number s
        let length = self.bit_length(s) - 1;
        let approx = 1u128 << length;

        // * --------ORIGINAL START--------------
        // let s_mul_100_000_000 = s * 100_000_000u128;
        // let s0 = s_mul_100_000_000 / approx; //
        // let s1 = s0 * 10 / (s0 / 10000000);
        // let index_1 = (s0 / 10000000 - 10) as usize;
        // let s2 = s1 * 100 / (s1 / 1000000);
        // let index_2 = (s1 / 1000000 - 100) as usize;
        // let s3 = s2 * 1000 / (s2 / 100000);
        // let index_3 = (s2 / 100000 - 1000) as usize;
        // let s4 = s3 * 10000 / (s3 / 10000);
        // let index_4 = (s3 / 10000 - 10000) as usize;
        // let s5 = s4 * 100000 / (s4 / 1000);
        // let index_5 = (s4 / 1000 - 100000) as usize;
        // let index_6 = (s5 / 100 - 1000000) as usize;
        // * --------ORIGINAL END--------------

        // we are breaking down s into s = approx * easy_1 * easy_2 * easy_3 * easy_4 * ....
        // so the log(s) = log(approx) + log(easy1) + log(easy2) + log(easy3) + log(easy4) * ...
        // we choose all these approx, and easy_i so that their logs are easy to compute
        // first: approx = 2^a with x chosen so approx is closest possible to s
        // hence in s = = approx * s0 = approx * (easy1 * easy2 * ...)
        // the s0 bit is going to be a number like 1.xxxx
        // Note: s = approx * s0  ( exactly in float world, in int world it is close enough )

        // we know that log(2^a) = a * log(2) so log(approx) is solved easily if we know constant log(2)

        // now we break s0 into pieces (easy1 * easy2 * easy4 ....)
        // we choose these easy_i so that they all numbers (in float word) like:
        // i=1 --> 1.?000000
        // i=2 --> 1.0?00000
        // i=3 --> 1.00?0000
        // i=4 --> 1.000?000
        // i=5 --> 1.0000?00
        // i=6 --> 1.00000?0
        // i=7 --> 1.000000? and so on  where ? is always a digit 1..9

        // Why? because we have log tables that give us these results. in other words:
        // log_arr_3 contains [ log(1.000), log(1.001), log(1.002), log(1.003), ... ,log(1.009) ]
        // (they are 'blown up' approximations here, in 'precise number' world )
        // So if we know the digit ? stands for in 1.00?000, we can just look up in log_arr_3
        // that digit is what index_3 is !!!

        // all the lines of codes:
        // 'let index_i = ( easy_(i-1) / 10000000 - 10) as usize;'  etc
        // are just a trick to isolate that ? digit for each level

        // Note: index_i depends on  easy_(i-1)
        // so index_1 is chosen so that

        let n = 1E8 as u128; // blow-up factor
        let s_blown = s * n;
        let start = s_blown / approx;
        // so start = s/approx i.e 9/8 =1.125..... blown up to 8 digits and truncated
        // now we look for easy_1 s.t. start = easy_1 * (extra_1) and easy_1 is start rounded to 1 digit (1.1) and blown up

        // then we break extra_1 into extra_1 = easy_2 * (extra_2) where easy_2 is extra_1 round to 2 digits (1.02) and blown up
        // then we break extra_2 into extra_2 = easy_3 * (extra_3) where easy_3 is extra_2 round to 2 digits (1.002) and blown up
        // and so on... we could re-write this process of getting easy_(n+1) and extra_(n+1) from easy_(n) as a function break_with_n_digits()

        // so we can change this : ---->
        let easy_1 = start * 10 / (start / 10000000);
        let easy_2 = easy_1 * 100 / (easy_1 / 1000000);
        let easy_3 = easy_2 * 1000 / (easy_2 / 100000);
        let easy_4 = easy_3 * 10000 / (easy_3 / 10000);
        let easy_5 = easy_4 * 100000 / (easy_4 / 1000);

        // to this : ---->
        // easy_1, extra_1 = break_with_n_digits(start, n=1)
        // easy_2, extra_2 = break_with_n_digits(easy_1, n=2)
        // easy_3, _       = break_with_n_digits(easy_2, n=3)
        // easy_4, _       = break_with_n_digits(easy_3, n=4)
        // easy_5, _       = break_with_n_digits(easy_4, n=5)
        // easy_6, _       = break_with_n_digits(easy_5, n=6)
        // and so on... till max_depth ( here max_depth is 6)
        //
        // where break_with_n_digits(x, n) --->  x * 10^n  / ( x / 10^(N-n) )
        // where N is the blow-up factor ( precision) at the beginning (here N = 8)

        // from each of the easy_(i-1), we get index_i [ you can change the susbscript so more intuitive]
        // rewriting this also as a function of n, say find_index(easy_sth, n)

        // we can change this : ---->
        let index_1 = (start / 10000000 - 10) as usize;
        let index_2 = (easy_1 / 1000000 - 100) as usize;
        let index_3 = (easy_2 / 100000 - 1000) as usize;
        let index_4 = (easy_3 / 10000 - 10000) as usize;
        let index_5 = (easy_4 / 1000 - 100000) as usize;
        let index_6 = (easy_5 / 100 - 1000000) as usize;

        // to this : ---->
        // index_1 = find_index_n( start, n=1)
        // index_2 = find_index_n( easy_1, n=2)
        // index_3 = find_index_n( easy_2, n=3)
        // index_4 = find_index_n( easy_3, n=4)
        // index_5 = find_index_n( easy_4, n=5)
        // index_6 = find_index_n( easy_5, n=6)
        // and so on... till max_depth ( here max_depth is 6)

        // where find_index_n(x, n) --->  (x * 10^(N-n) - 10^n ) as usize
        // where N is the blow-up factor ( precision) at the beginning (here N = 8)

        // finally use index_1..index_max_depth to lookup the log(easy_i)

        let lnx1 = log_arr_1[index_1] as u128;
        let lnx2 = log_arr_2[index_2] as u128;
        let lnx3 = log_arr_3[index_3] as u128;
        let lnx4 = log_arr_4[index_4] as u128;
        let lnx5 = log_arr_5[index_5] as u128;
        let lnx6 = log_arr_6[index_6] as u128;

        let log_of_2 = 69314718 * (length as u128);

        let tmp_result = log_of_2 + lnx1 + lnx2 + lnx3 + lnx4 + lnx5 + lnx6;
        let result = PreciseNumber::new(tmp_result)
            .unwrap()
            .checked_div(&multiply)
            .unwrap();

        // so you can imagine we can write the whole function as log(x , N, max_depth)
        // IMPORTANT: if u change N, you'd need to change the precison (the number of digits)
        // in the log tables. i.e if N is 9, then all the logs in log_array_i[] have to be 9-digit precisions, as well as 'log_of_2' and alse 'multiply' (which is N i think)
        // to increase max_depth, u need to add extra lines in log tables

        // I think a rewrite would make it clearer to build intuition and good documenting
        // and take ownership of the function
        // from there we could also test the accuracy of this function in Rust
        // vs normal Rust float-world log()
        // and finally test the boundaries in vs Solana Compute
        // for example you could stick this log function alone in a Anchor smart contract and
        // check the compute it consumes at different levels of N and/or max_depth

        return result;
    }

    /// Replacement natural log function
    pub fn ln(&self, s: PreciseNumber) -> PreciseNumber {
        // bit length
        let bit_length = 127u128 - s.to_imprecise().unwrap().leading_zeros() as u128;
        // approx = highest 2^x < s
        let approx = 2u128.checked_pow(bit_length as u32).unwrap();
        let approx_p = PreciseNumber::new(approx).unwrap();
        // i0 = s/2^x
        let i0 = s.checked_div(&approx_p).unwrap();

        let i1 = i0
            .checked_mul(&PreciseNumber::new(10u128).unwrap())
            .unwrap()
            .checked_sub(&PreciseNumber::new(10u128).unwrap())
            .unwrap()
            .floor()
            .unwrap()
            .checked_div(&PreciseNumber::new(10u128).unwrap())
            .unwrap()
            .checked_add(&PreciseNumber::new(1u128).unwrap())
            .unwrap();
        let i1_tmp = i0.checked_div(&i1).unwrap();

        let i2 = i1_tmp
            .checked_mul(&PreciseNumber::new(100u128).unwrap())
            .unwrap()
            .checked_sub(&PreciseNumber::new(100u128).unwrap())
            .unwrap()
            .floor()
            .unwrap()
            .checked_div(&PreciseNumber::new(100u128).unwrap())
            .unwrap()
            .checked_add(&PreciseNumber::new(1u128).unwrap())
            .unwrap();
        let i2_tmp = i1_tmp.checked_div(&i2).unwrap();

        let i3 = i2_tmp
            .checked_mul(&PreciseNumber::new(1000u128).unwrap())
            .unwrap()
            .checked_sub(&PreciseNumber::new(1000u128).unwrap())
            .unwrap()
            .floor()
            .unwrap()
            .checked_div(&PreciseNumber::new(1000u128).unwrap())
            .unwrap()
            .checked_add(&PreciseNumber::new(1u128).unwrap())
            .unwrap();
        let i3_tmp = i2_tmp.checked_div(&i3).unwrap();

        let i4 = i3_tmp
            .checked_mul(&PreciseNumber::new(10000u128).unwrap())
            .unwrap()
            .checked_sub(&PreciseNumber::new(10000u128).unwrap())
            .unwrap()
            .floor()
            .unwrap()
            .checked_div(&PreciseNumber::new(10000u128).unwrap())
            .unwrap()
            .checked_add(&PreciseNumber::new(1u128).unwrap())
            .unwrap();
        let i4_tmp = i3_tmp.checked_div(&i4).unwrap();

        let i5 = i4_tmp
            .checked_mul(&PreciseNumber::new(100000u128).unwrap())
            .unwrap()
            .checked_sub(&PreciseNumber::new(100000u128).unwrap())
            .unwrap()
            .floor()
            .unwrap()
            .checked_div(&PreciseNumber::new(100000u128).unwrap())
            .unwrap()
            .checked_add(&PreciseNumber::new(1u128).unwrap())
            .unwrap();
        let i5_tmp = i4_tmp.checked_div(&i5).unwrap();

        let i6 = i5_tmp
            .checked_mul(&PreciseNumber::new(1000000u128).unwrap())
            .unwrap()
            .checked_sub(&PreciseNumber::new(1000000u128).unwrap())
            .unwrap()
            .floor()
            .unwrap()
            .checked_div(&PreciseNumber::new(1000000u128).unwrap())
            .unwrap()
            .checked_add(&PreciseNumber::new(1u128).unwrap())
            .unwrap();
        let i6_tmp = i5_tmp.checked_div(&i6).unwrap();

        let i7 = i6_tmp
            .checked_mul(&PreciseNumber::new(1000000u128).unwrap())
            .unwrap()
            .checked_sub(&PreciseNumber::new(1000000u128).unwrap())
            .unwrap()
            .floor()
            .unwrap()
            .checked_div(&PreciseNumber::new(1000000u128).unwrap())
            .unwrap()
            .checked_add(&PreciseNumber::new(1u128).unwrap())
            .unwrap();

        let re_approx_p = i7
            .checked_mul(&i6)
            .unwrap()
            .checked_mul(&i5)
            .unwrap()
            .checked_mul(&i4)
            .unwrap()
            .checked_mul(&i3)
            .unwrap()
            .checked_mul(&i2)
            .unwrap()
            .checked_mul(&i1)
            .unwrap()
            .checked_mul(&approx_p)
            .unwrap();

        println!("here {:?}", re_approx_p);
        re_approx_p
    }
}

#[cfg(test)]
mod tests {
    // use spl_math::precise_number::PreciseNumber;
    // use spl_math::uint::U256;

    use super::*;

    // type InnerUint = U256;

    #[test]
    fn test_log_vs_log_clearer() {
        let calculator = Calculator::new(9u128);
        let log_orig = calculator.log(calculator.value);
        let log_clear = calculator.log_clearer(calculator.value);
        assert_eq!(log_clear, log_orig);
    }

    // #[test]
    // fn test_ln() {
    //     let calculator = Calculator::new(10u128);
    //     let expected = PreciseNumber {
    //         value: InnerUint::from(9999990390384u128),
    //     };
    //     assert_eq!(
    //         calculator.ln(PreciseNumber::new(calculator.value).unwrap()),
    //         expected
    //     );
    // }

    // #[test]
    // fn test_log() {
    //     let calculator = Calculator::new(9u128);
    //     let expected = PreciseNumber {
    //         value: InnerUint::from(2197224130000u128),
    //     };
    //     assert_eq!(calculator.log(calculator.value), expected);
    // }

    // #[test]
    // fn test_msb() {
    //     let calculator = Calculator::new(10u128);
    //     assert_eq!(calculator.most_signficant_bit(), 3u128);
    // }

    // #[test]
    // fn test_msb_precise() {
    //     let calculator = Calculator::new(10u128);
    //     assert_eq!(calculator.most_signficant_bit_precise(), 43u128);
    // }
}
