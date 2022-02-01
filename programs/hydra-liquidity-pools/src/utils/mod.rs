use crate::errors::ErrorCode;

pub fn to_u128(val: u64) -> Result<u128, ErrorCode> {
    val.try_into()
        .map_err(|_e| ErrorCode::NumberConversionFailure)
}

pub fn to_u64(val: u128) -> Result<u64, ErrorCode> {
    val.try_into()
        .map_err(|_e| ErrorCode::NumberConversionFailure)
}
