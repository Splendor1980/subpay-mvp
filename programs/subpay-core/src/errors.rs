use rialo_s_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum SubPayError {
    #[error("Subscription already exists")] AlreadyInitialized,
    #[error("Subscription not initialized")] NotInitialized,
    #[error("Subscription is not active")] SubscriptionInactive,
    #[error("Max payments already reached")] MaxPaymentsReached,
    #[error("Too soon for next payment")] TooSoon,
    #[error("Arithmetic overflow")] Overflow,
    #[error("Invalid authority")] InvalidAuthority,
    #[error("Insufficient balance")] InsufficientBalance,
    #[error("Missing signer")] MissingSigner,
}

impl From<SubPayError> for ProgramError {
    fn from(e: SubPayError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
