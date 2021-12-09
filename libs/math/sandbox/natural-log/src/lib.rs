use spl_math::precise_number::PreciseNumber;
use spl_math::uint::U256;

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
    use spl_math::precise_number::PreciseNumber;
    type InnerUint = U256;

    use super::*;

    #[test]
    fn test_ln() {
        let calculator = Calculator::new(10u128);
        let expected = PreciseNumber {
            value: InnerUint::from(9999990390384u128),
        };
        assert_eq!(
            calculator.ln(PreciseNumber::new(calculator.value).unwrap()),
            expected
        );
    }

    #[test]
    fn test_log() {
        let calculator = Calculator::new(9u128);
        let expected = PreciseNumber {
            value: InnerUint::from(2197224130000u128),
        };
        assert_eq!(calculator.log(calculator.value), expected);
    }

    #[test]
    fn test_msb() {
        let calculator = Calculator::new(10u128);
        assert_eq!(calculator.most_signficant_bit(), 3u128);
    }

    #[test]
    fn test_msb_precise() {
        let calculator = Calculator::new(10u128);
        assert_eq!(calculator.most_signficant_bit_precise(), 43u128);
    }
}
