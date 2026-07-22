import {
  PublicKey,
  TransactionBuilder,
  type Instruction,
  SYSTEM_PROGRAM_ID,
  type PDA,
} from "@rialo/ts-cdk";

// ── Program ID ──
export const SUBPAY_PROGRAM_ID = PublicKey.fromBytes(
  new Uint8Array([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
    0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
    0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
  ])
);

// ── Stream types (match on-chain enum discriminants) ──
export const StreamType = {
  Subscription: 0,
  Streaming: 1,
  Vesting: 2,
  RwaDividend: 3,
  Treasury: 4,
} as const;
export type StreamTypeValue = (typeof StreamType)[keyof typeof StreamType];

// ── PDA derivation ──
export function deriveStreamPDA(
  payer: PublicKey,
  recipient: PublicKey,
  mint: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): PDA {
  return PublicKey.findProgramAddress(
    [payer.toBytes(), recipient.toBytes(), mint.toBytes()],
    programId,
  );
}

/** @deprecated Use deriveStreamPDA */
export const deriveSubscriptionPDA = deriveStreamPDA;

// ── Instruction: CreateStream (unified) ──
// Borsh layout: [discriminant:1=CreateStream, stream_type:1, amount:8, interval:8, max_total:8, cliff_time:8, end_time:8]
export function createStreamInstruction(
  payer: PublicKey,
  recipient: PublicKey,
  mint: PublicKey,
  params: {
    streamType: StreamTypeValue;
    amount: bigint;
    interval: bigint;
    maxTotal: bigint;
    cliffTime: bigint;
    endTime: bigint;
  },
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): Instruction {
  const [streamPDA] = deriveStreamPDA(payer, recipient, mint, programId);

  const buf = new ArrayBuffer(1 + 1 + 8 + 8 + 8 + 8 + 8);
  const view = new DataView(buf);
  let offset = 0;
  view.setUint8(offset, 0); offset += 1;                             // CreateStream discriminant
  view.setUint8(offset, params.streamType); offset += 1;             // stream_type
  view.setBigUint64(offset, params.amount, true); offset += 8;       // amount (LE)
  view.setBigInt64(offset, params.interval, true); offset += 8;      // interval (LE)
  view.setBigUint64(offset, params.maxTotal, true); offset += 8;     // max_total (LE)
  view.setBigInt64(offset, params.cliffTime, true); offset += 8;     // cliff_time (LE)
  view.setBigInt64(offset, params.endTime, true);                    // end_time (LE)

  return {
    programId,
    data: new Uint8Array(buf),
    accounts: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: streamPDA, isSigner: false, isWritable: true },
      { pubkey: recipient, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: PublicKey.fromString(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
    ],
  };
}

// ── Instruction: CancelStream ──
export function cancelStreamInstruction(
  payer: PublicKey,
  streamPDA: PublicKey,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): Instruction {
  return {
    programId,
    data: new Uint8Array([1]), // CancelStream discriminant
    accounts: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: streamPDA, isSigner: false, isWritable: true },
    ],
  };
}

// ── Build a ready-to-sign TransactionBuilder ──
export function buildStreamTx(instruction: Instruction, payer: PublicKey): TransactionBuilder {
  return TransactionBuilder.create().addInstruction(instruction).setPayer(payer);
}

// ── Legacy compat ──
export function createCreateSubscriptionInstruction(
  user: PublicKey,
  merchant: PublicKey,
  mint: PublicKey,
  amount: bigint,
  interval: bigint,
  maxPayments: bigint,
  programId: PublicKey = SUBPAY_PROGRAM_ID,
): Instruction {
  return createStreamInstruction(user, merchant, mint, {
    streamType: StreamType.Subscription,
    amount,
    interval,
    maxTotal: amount * maxPayments,
    cliffTime: BigInt(0),
    endTime: BigInt(0),
  }, programId);
}

/** Compute how many tokens should have streamed by now (for UI display) */
export function computeStreamedAmount(
  ratePerSec: number,
  startTimeSec: number,
  nowSec: number,
  maxTotal: number,
): number {
  const elapsed = Math.max(0, nowSec - startTimeSec);
  return Math.min(maxTotal, ratePerSec * elapsed);
}
