use borsh::{BorshDeserialize, BorshSerialize};
use rialo_s_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Subscription {
    pub is_initialized: bool,
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub interval: i64,
    pub max_payments: u64,
    pub payments_made: u64,
    pub next_payment_time: i64,
    pub active: bool,
    pub bump: u8,
}

impl Subscription {
    pub fn is_due(&self, current_time: i64) -> bool {
        self.is_initialized
            && self.active
            && self.payments_made < self.max_payments
            && current_time >= self.next_payment_time
    }

    pub fn advance(&mut self, current_time: i64) {
        self.payments_made = self.payments_made.saturating_add(1);
        self.next_payment_time = current_time.saturating_add(self.interval);
        if self.payments_made >= self.max_payments {
            self.active = false;
        }
    }
}
