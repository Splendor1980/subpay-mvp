use rialo_s_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum SubPayError {
    #[error("Stream already exists")] AlreadyInitialized,
    #[error("Stream not initialized")] NotInitialized,
    #[error("Stream is not active")] StreamInactive,
    #[error("Max total already paid")] MaxTotalReached,
    #[error("Too soon for next payment")] TooSoon,
    #[error("Arithmetic overflow")] Overflow,
    #[error("Invalid authority")] InvalidAuthority,
    #[error("Insufficient balance")] InsufficientBalance,
    #[error("Missing signer")] MissingSigner,
    #[error("Invalid stream type")] InvalidStreamType,
}

impl From<SubPayError> for ProgramError {
    fn from(e: SubPayError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
