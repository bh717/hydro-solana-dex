use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum CurveType {
    ConstantProduct,
    HMM,
}

impl Default for CurveType {
    fn default() -> Self {
        CurveType::ConstantProduct
    }
}
