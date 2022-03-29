use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Copy)]
pub enum CurveType {
    ConstantProduct,
    HMM,
}

impl Default for CurveType {
    fn default() -> Self {
        CurveType::ConstantProduct
    }
}
