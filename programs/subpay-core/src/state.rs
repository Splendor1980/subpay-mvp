use borsh::{BorshDeserialize, BorshSerialize};
use rialo_s_program::pubkey::Pubkey;

/// Type of payment stream.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
#[borsh(use_discriminant = true)]
pub enum StreamType {
    Subscription = 0,
    Streaming = 1,
    Vesting = 2,
    RwaDividend = 3,
    Treasury = 4,
}

/// A payment stream on SubPay.
/// Unified struct for recurring, streaming, vesting, RWA, and treasury.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Stream {
    pub is_initialized: bool,
    pub stream_type: StreamType,
    pub payer: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub interval: i64,
    pub max_total: u64,
    pub total_paid: u64,
    pub next_payment_time: i64,
    pub cliff_time: i64,
    pub end_time: i64,
    pub active: bool,
    pub bump: u8,
}

impl Stream {
    pub fn is_due(&self, current_time: i64) -> bool {
        if !self.is_initialized || !self.active {
            return false;
        }
        if self.total_paid >= self.max_total {
            return false;
        }
        match self.stream_type {
            StreamType::Subscription | StreamType::Treasury => {
                current_time >= self.next_payment_time
            }
            StreamType::Streaming => {
                current_time >= self.next_payment_time
                    && current_time - self.next_payment_time >= 1
            }
            StreamType::Vesting => {
                current_time >= self.cliff_time
                    && current_time < self.end_time
                    && self.total_paid < self.max_total
            }
            StreamType::RwaDividend => {
                current_time >= self.next_payment_time
            }
        }
    }

    pub fn advance(&mut self, current_time: i64) -> u64 {
        match self.stream_type {
            StreamType::Subscription | StreamType::Treasury | StreamType::RwaDividend => {
                self.total_paid = self.total_paid.saturating_add(self.amount);
                self.next_payment_time = current_time.saturating_add(self.interval);
                if self.total_paid >= self.max_total {
                    self.active = false;
                }
                self.amount
            }
            StreamType::Streaming => {
                let elapsed = current_time.saturating_sub(self.next_payment_time) as u64;
                let payment = (self.amount as u64).saturating_mul(elapsed.min(3600));
                self.total_paid = self.total_paid.saturating_add(payment);
                self.next_payment_time = current_time;
                if self.total_paid >= self.max_total {
                    self.active = false;
                }
                payment
            }
            StreamType::Vesting => {
                let elapsed = current_time.saturating_sub(self.cliff_time) as u64;
                let total_secs = self.end_time.saturating_sub(self.cliff_time) as u64;
                if total_secs == 0 {
                    return 0;
                }
                let expected = (self.max_total as u128)
                    .saturating_mul(elapsed as u128)
                    .saturating_div(total_secs as u128) as u64;
                let payment = expected.saturating_sub(self.total_paid);
                self.total_paid = self.total_paid.saturating_add(payment);
                if current_time >= self.end_time || self.total_paid >= self.max_total {
                    self.active = false;
                }
                payment
            }
        }
    }
}
