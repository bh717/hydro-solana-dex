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

impl Into<Vec<String>> for FeeResult {
    fn into(self) -> Vec<String> {
        vec![
            self.fee_amount.to_scale(self.fee_amount.scale).to_string(),
            self.fee_percentage
                .to_scale(self.fee_amount.scale)
                .to_string(),
            self.amount_ex_fee
                .to_scale(self.fee_amount.scale)
                .to_string(),
            self.vol_adj_fee_last_update.to_scale(0).to_string(),
            self.vol_adj_fee_last_price
                .to_scale(self.vol_adj_fee_last_price.scale)
                .to_string(),
            self.vol_adj_fee_last_ewma
                .to_scale(self.vol_adj_fee_last_ewma.scale)
                .to_string(),
        ]
    }
}
