use borsh::BorshDeserialize;
pub mod errors;
pub mod instructions;
pub mod state;

use rialo_s_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};
use instructions::SubPayInstruction;

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = SubPayInstruction::try_from_slice(instruction_data)
        .map_err(|_| {
            msg!("SubPay: invalid instruction data");
            rialo_s_program::program_error::ProgramError::InvalidInstructionData
        })?;
    match instruction {
        SubPayInstruction::CreateStream { stream_type, amount, interval, max_total, cliff_time, end_time } => {
            instructions::process_create_stream(
                program_id, accounts, stream_type, amount, interval, max_total, cliff_time, end_time
            )
        }
        SubPayInstruction::CancelStream => {
            instructions::process_cancel_stream(program_id, accounts)
        }
        SubPayInstruction::ExecutePayment => {
            instructions::process_execute_payment(program_id, accounts)
        }
    }
}
