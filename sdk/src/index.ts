import {
  PublicKey,
  TransactionBuilder,
  Instruction,
  SYSTEM_PROGRAM_ID,
} from "@rialo/ts-cdk";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

/** Deploy this with your real program keypair. */
export const SUBPAY_PROGRAM_ID = new PublicKey(
  "Eus8teHEggQ8ibaMkMRyTwrKVK3i2ByfjRXi7KVycqte"
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

  const discriminator = Buffer.alloc(1, 0);
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
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
  };
}

export function createCancelSubscriptionInstruction(
  user: PublicKey,
  subscriptionPDA: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): Instruction {
  const discriminator = Buffer.alloc(1, 1);
  return {
    programId,
    data: discriminator,
    accounts: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: subscriptionPDA, isSigner: false, isWritable: true },
    ],
  };
}

export function createExecutePaymentInstruction(
  subscriptionPDA: PublicKey,
  userTokenAccount: PublicKey,
  merchantTokenAccount: PublicKey,
  mint: PublicKey,
  tokenProgramId: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): Instruction {
  const discriminator = Buffer.alloc(1, 2);
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

export function createCancelAndRevokeTransaction(
  user: PublicKey,
  subscriptionPDA: PublicKey,
  userTokenAccount: PublicKey,
  mint: PublicKey,
  tokenProgramId: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): TransactionBuilder {
  const cancelIx = createCancelSubscriptionInstruction(user, subscriptionPDA, programId);

  const [delegate] = deriveSubscriptionPDA(user, subscriptionPDA, mint, programId);
  const approveData = Buffer.alloc(9);
  approveData.writeUInt8(4, 0);
  approveData.writeBigUInt64LE(BigInt(0), 1);

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
