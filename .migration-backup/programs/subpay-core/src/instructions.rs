use borsh::{BorshDeserialize, BorshSerialize};
use rialo_s_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{clock::Clock, Sysvar},
};
use crate::errors::SubPayError;
use crate::state::{Stream, StreamType};

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
pub enum SubPayInstruction {
    CreateStream {
        stream_type: u8,
        amount: u64,
        interval: i64,
        max_total: u64,
        cliff_time: i64,
        end_time: i64,
    },
    CancelStream,
    ExecutePayment,
}

fn stream_seeds<'a>(payer: &'a Pubkey, recipient: &'a Pubkey, mint: &'a Pubkey) -> [&'a [u8]; 3] {
    [payer.as_ref(), recipient.as_ref(), mint.as_ref()]
}

fn build_transfer_checked_ix(
    token_prog: &Pubkey, src: &Pubkey, mint: &Pubkey, dst: &Pubkey,
    delegate: &Pubkey, amount: u64, decimals: u8,
) -> Instruction {
    let mut data = vec![12u8]; // TransferChecked tag
    data.extend_from_slice(&amount.to_le_bytes());
    data.push(decimals);
    Instruction {
        program_id: *token_prog,
        accounts: vec![
            AccountMeta { pubkey: *src, is_signer: false, is_writable: true },
            AccountMeta { pubkey: *mint, is_signer: false, is_writable: false },
            AccountMeta { pubkey: *dst, is_signer: false, is_writable: true },
            AccountMeta { pubkey: *delegate, is_signer: true, is_writable: false },
        ],
        data,
    }
}

pub fn process_create_stream(
    program_id: &Pubkey, accounts: &[AccountInfo],
    stream_type: u8, amount: u64, interval: i64,
    max_total: u64, cliff_time: i64, end_time: i64,
) -> ProgramResult {
    let ai = &mut accounts.iter();
    let payer = next_account_info(ai)?;
    let stream_acc = next_account_info(ai)?;
    let recipient = next_account_info(ai)?;
    let mint = next_account_info(ai)?;

    if !payer.is_signer { return Err(SubPayError::MissingSigner.into()); }

    let st = match stream_type {
        0 => StreamType::Subscription,
        1 => StreamType::Streaming,
        2 => StreamType::Vesting,
        3 => StreamType::RwaDividend,
        4 => StreamType::Treasury,
        _ => return Err(ProgramError::InvalidInstructionData),
    };

    let seeds = stream_seeds(payer.key, recipient.key, mint.key);
    let (pda, bump) = Pubkey::find_program_address(&seeds, program_id);
    if stream_acc.key != &pda { return Err(ProgramError::InvalidAccountData); }

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let stream = Stream {
        is_initialized: true,
        stream_type: st,
        payer: *payer.key,
        recipient: *recipient.key,
        mint: *mint.key,
        amount, interval, max_total,
        total_paid: 0,
        next_payment_time: now.saturating_add(interval),
        cliff_time, end_time,
        active: true, bump,
    };

    let mut d = stream_acc.data.borrow_mut();
    stream.serialize(&mut &mut d[..])?;
    msg!("SubPay: stream created (type={}, amount={})", stream_type, amount);
    Ok(())
}

pub fn process_cancel_stream(
    program_id: &Pubkey, accounts: &[AccountInfo],
) -> ProgramResult {
    let ai = &mut accounts.iter();
    let payer = next_account_info(ai)?;
    let stream_acc = next_account_info(ai)?;
    if !payer.is_signer { return Err(SubPayError::MissingSigner.into()); }

    let d = stream_acc.data.borrow();
    let s = Stream::try_from_slice(&d).map_err(|_| ProgramError::InvalidAccountData)?;
    drop(d);

    if s.payer != *payer.key { return Err(SubPayError::InvalidAuthority.into()); }
    if !s.active { return Err(SubPayError::StreamInactive.into()); }

    let seeds = stream_seeds(&s.payer, &s.recipient, &s.mint);
    let (pda, _) = Pubkey::find_program_address(&seeds, program_id);
    if stream_acc.key != &pda { return Err(ProgramError::InvalidAccountData); }

    let mut s2 = s.clone();
    s2.active = false;
    let mut d = stream_acc.data.borrow_mut();
    s2.serialize(&mut &mut d[..])?;
    msg!("SubPay: stream cancelled");
    Ok(())
}

pub fn process_execute_payment(
    program_id: &Pubkey, accounts: &[AccountInfo],
) -> ProgramResult {
    let ai = &mut accounts.iter();
    let stream_acc = next_account_info(ai)?;
    let src = next_account_info(ai)?;
    let dst = next_account_info(ai)?;
    let mint = next_account_info(ai)?;
    let token_prog = next_account_info(ai)?;

    let d = stream_acc.data.borrow();
    let s = Stream::try_from_slice(&d).map_err(|_| ProgramError::InvalidAccountData)?;
    drop(d);

    let seeds = stream_seeds(&s.payer, &s.recipient, &s.mint);
    let (pda, _) = Pubkey::find_program_address(&seeds, program_id);
    if stream_acc.key != &pda { return Err(ProgramError::InvalidAccountData); }

    let clock = Clock::get()?;
    if !s.is_due(clock.unix_timestamp) { return Err(SubPayError::TooSoon.into()); }

    let payment = {
        let mut s2 = s.clone();
        let p = s2.advance(clock.unix_timestamp);
        let mut d = stream_acc.data.borrow_mut();
        s2.serialize(&mut &mut d[..])?;
        p
    };

    if payment == 0 {
        msg!("SubPay: payment is 0, nothing to transfer");
        return Ok(());
    }

    let ix = build_transfer_checked_ix(
        token_prog.key, src.key, mint.key, dst.key,
        &pda, payment, 6,
    );
    let signers = [s.payer.as_ref(), s.recipient.as_ref(), s.mint.as_ref(), &[s.bump]];
    invoke_signed(&ix, &[src.clone(), dst.clone(), mint.clone(), token_prog.clone()], &[&signers])?;

    msg!("SubPay: payment executed (type={:?}, amount={})", s.stream_type, payment);
    Ok(())
}
