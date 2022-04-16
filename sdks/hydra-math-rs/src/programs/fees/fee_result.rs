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
