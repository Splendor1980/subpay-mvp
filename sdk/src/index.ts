import {
  PublicKey,
  TransactionBuilder,
  Instruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from "@rialo/ts-cdk";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

/** Deploy this with your real program keypair. */
export const SUBPAY_PROGRAM_ID = new PublicKey(
  "SubPay1111111111111111111111111111111111111"
);

export const SUBPAY_SEED_PREFIX = Buffer.from("subpay");

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface SubscriptionState {
  isInitialized: boolean;
  user: PublicKey;
  merchant: PublicKey;
  mint: PublicKey;
  amount: bigint;
  interval: bigint;
  maxPayments: bigint;
  paymentsMade: bigint;
  nextPaymentTime: bigint;
  active: boolean;
  bump: number;
}

// ──────────────────────────────────────────────
// PDA Derivation
// ──────────────────────────────────────────────

export function deriveSubscriptionPDA(
  user: PublicKey,
  merchant: PublicKey,
  mint: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddress(
    [user.toBuffer(), merchant.toBuffer(), mint.toBuffer()],
    programId,
  );
}

// ──────────────────────────────────────────────
// Instruction Builders
// ──────────────────────────────────────────────

/**
 * Build the CreateSubscription instruction.
 *
 * Flow:
 * 1. User calls SPL Token `Approve(delegate=PDA, amount=totalCap)`.
 * 2. User calls this instruction.
 */
export function createCreateSubscriptionInstruction(
  user: PublicKey,
  merchant: PublicKey,
  mint: PublicKey,
  amount: bigint,
  interval: bigint,
  maxPayments: bigint,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): Instruction {
  const [subPDA] = deriveSubscriptionPDA(user, merchant, mint, programId);

  // Instruction discriminator (borsh enum index)
  const discriminator = Buffer.alloc(1, 0); // 0 = CreateSubscription

  // Serialize payload: amount (u64), interval (i64), max_payments (u64)
  const payload = Buffer.alloc(24);
  payload.writeBigUInt64LE(amount, 0);
  payload.writeBigInt64LE(interval, 8);
  payload.writeBigUInt64LE(maxPayments, 16);

  const data = Buffer.concat([discriminator, payload]);

  return {
    programId,
    data,
    accounts: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: subPDA, isSigner: false, isWritable: true },
      { pubkey: merchant, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
  };
}

/**
 * Build the CancelSubscription instruction.
 */
export function createCancelSubscriptionInstruction(
  user: PublicKey,
  subscriptionPDA: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): Instruction {
  const discriminator = Buffer.alloc(1, 1); // 1 = CancelSubscription

  return {
    programId,
    data: discriminator,
    accounts: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: subscriptionPDA, isSigner: false, isWritable: true },
    ],
  };
}

/**
 * Build the ExecutePayment instruction (called by reactive tx).
 */
export function createExecutePaymentInstruction(
  subscriptionPDA: PublicKey,
  userTokenAccount: PublicKey,
  merchantTokenAccount: PublicKey,
  mint: PublicKey,
  tokenProgramId: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): Instruction {
  const discriminator = Buffer.alloc(1, 2); // 2 = ExecutePayment

  return {
    programId,
    data: discriminator,
    accounts: [
      { pubkey: subscriptionPDA, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: merchantTokenAccount, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ],
  };
}

/**
 * Build a batch transaction containing CancelSubscription + Token Approve(0).
 * This atomically cancels the subscription AND revokes the delegate allowance.
 */
export function createCancelAndRevokeTransaction(
  user: PublicKey,
  subscriptionPDA: PublicKey,
  userTokenAccount: PublicKey,
  mint: PublicKey,
  tokenProgramId: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): TransactionBuilder {
  const cancelIx = createCancelSubscriptionInstruction(user, subscriptionPDA, programId);

  // SPL Token Approve(delegate=PDA, amount=0) — revoke
  const [delegate] = deriveSubscriptionPDA(user, subscriptionPDA, mint, programId);
  const approveData = Buffer.alloc(9);
  approveData.writeUInt8(4, 0);   // Approve instruction tag (SPL Token)
  approveData.writeBigUInt64LE(BigInt(0), 1);  // amount = 0

  const revokeIx: Instruction = {
    programId: tokenProgramId,
    data: approveData,
    accounts: [
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: delegate, isSigner: false, isWritable: false },
      { pubkey: user, isSigner: true, isWritable: false },
    ],
  };

  return new TransactionBuilder()
    .addInstruction(cancelIx)
    .addInstruction(revokeIx);
}
