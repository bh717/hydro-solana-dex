use crate::decimal::Decimal;

#[derive(Default, Builder, Debug, PartialEq)]
#[builder(setter(into))]
pub struct FeeResult {
    #[builder(default = "Decimal::zero()")]
    pub fee_amount: Decimal,
    #[builder(default = "Decimal::zero()")]
    pub fee_percentage: Decimal,
    #[builder(default = "Decimal::zero()")]
    pub amount_ex_fee: Decimal,
    #[builder(default = "Decimal::zero()")]
    pub vol_adj_fee_last_update: Decimal,
    #[builder(default = "Decimal::zero()")]
    pub vol_adj_fee_last_price: Decimal,
    #[builder(default = "Decimal::zero()")]
    pub vol_adj_fee_last_ewma: Decimal,
}

impl Into<Vec<u64>> for FeeResult {
    fn into(self) -> Vec<u64> {
        vec![
            self.fee_amount.to_scaled_amount(self.fee_amount.scale),
            self.fee_percentage.to_scaled_amount(self.fee_amount.scale),
            self.amount_ex_fee.to_scaled_amount(self.fee_amount.scale),
            self.vol_adj_fee_last_update.to_scaled_amount(0),
            self.vol_adj_fee_last_price
                .to_scaled_amount(self.vol_adj_fee_last_price.scale),
            self.vol_adj_fee_last_ewma
                .to_scaled_amount(self.vol_adj_fee_last_ewma.scale),
        ]
    }
}
//
// impl From<Vec<u64>> for FeeResult {
//     fn from(vector: Vec<u64>) -> Self {
//         FeeResult {
//             fees: vector[0],
//             amount_ex_fees: vector[1],
//         }
//     }
// }
