use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg(Calulation of lp tokens failed)]
    CalculateLpTokensFailed,

    #[msg(Pool has not been funded for the first time. Please use addFirstLiquidity instruction)]
    PoolNotFunded,

    #[msg(Pool already funded for the first time. Please use addLiquidity instruction)]
    PoolAlreadyFunded,

    #[msg("Slippage Amount Exceeded")]
    SlippageExceeded,

    #[msg("Invalid vault to SwapResult amounts")]
    InvalidVaultToSwapResultAmounts,

    #[msg("Mint address provided doesn't match pools")]
    InvalidMintAddress,

    #[msg("Invalid Fee input")]
    InvalidFee,

    #[msg("Token addresses order is invalid")]
    InvalidTokenOrder,
}
