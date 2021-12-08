use spl_math::precise_number::PreciseNumber;
use spl_math::uint::U256;

pub struct Calculator {
    value: u128,
}

impl Calculator {
    pub fn new(
        value: u128,
    ) -> Self {
        Self {
            value,
        }
    }

    pub fn most_signficant_bit(&self) -> u128 {
        println!("msb {}", self.value.leading_zeros());
        127u128 - self.value.leading_zeros() as u128
    }

    pub fn most_signficant_bit_precise(&self) -> u128 {
        // testing a more efficient way of calculating bit_length
        let precise_value = PreciseNumber::new(self.value).unwrap();
        println!("msb_p {}", precise_value.value.leading_zeros());
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

    pub fn log(&self, s: u128) -> PreciseNumber {
        let log_arr_1: [u32; 10] = [
            0, 9531017, 18232155, 26236426, 33647223, 40546510, 47000362, 53062825, 58778666, 64185388,
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
}

#[cfg(test)]
mod tests {
    use spl_math::precise_number::PreciseNumber;
    type InnerUint = U256;

    use super::*;

    #[test]
    fn test_log() {
        let calculator = Calculator::new(9u128);
        let expected = PreciseNumber { value: InnerUint::from(2197224130000u128) };
        assert_eq!(calculator.log(calculator.value), expected);
    }

    #[test]
    fn test_msb() {
        let calculator = Calculator::new(8u128);
        assert_eq!(calculator.most_signficant_bit(), 3u128);
    }

    #[test]
    fn test_msb_precise() {
        let calculator = Calculator::new(8u128);
        assert_eq!(calculator.most_signficant_bit_precise(), 42u128);
    }
}
