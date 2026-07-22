import { useState } from "react";
import { useActiveAccount, useSignAndSendTransaction } from "@rialo/frost";
import { PublicKey, TransactionBuilder } from "@rialo/ts-cdk";
import {
  SUBPAY_PROGRAM_ID,
  deriveSubscriptionPDA,
  createCreateSubscriptionInstruction,
} from "@/sdk/index";

export function CreateSubscription() {
  const account = useActiveAccount();
  const { mutateAsync: signAndSendAsync } = useSignAndSendTransaction();
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [intervalDays, setIntervalDays] = useState("30");
  const [maxPayments, setMaxPayments] = useState("12");
  const [step, setStep] = useState<"approve" | "subscribe" | "done">("approve");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const publicKey = account?.publicKey ? new PublicKey(account.publicKey) : null;
  const merchantPub = null;

  if (!publicKey) {
    return <p>Connect your wallet to create a subscription.</p>;
  }

  const amtBig = BigInt(Math.round(parseFloat(amount || "0") * 1_000_000));
  const totalCap = amtBig * BigInt(maxPayments || "0");

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      if (!merchantPub || !publicKey) return;

      const USDC_MINT = new PublicKey(new Uint8Array([0x16,0x72,0xf4,0xc6,0x8e,0x5d,0x88,0x2a,0x8e,0x7a,0x07,0x56,0xcf,0x61,0x9f,0x09,0x14,0x7c,0x8d,0xb3,0xe0,0xd4,0x2a,0x62,0xcb,0x25,0x0b,0x2e]));
      const TOKEN_PROGRAM = new PublicKey(new Uint8Array([0x06,0xdd,0xf6,0xe1,0xd7,0x65,0xa1,0x93,0xd9,0xcb,0xe1,0x46,0xce,0xeb,0x79,0xac,0x1c,0xb4,0x85,0xed,0x5f,0x5b,0x37,0x91,0x3a,0x8c,0xf5,0x85,0x7e,0xff,0x00,0xa9]));

      const userATA = PublicKey.findProgramAddressSync(
        [publicKey.toBuffer(), TOKEN_PROGRAM.toBuffer(), USDC_MINT.toBuffer()],
        new PublicKey(new Uint8Array([0x22,0xdc,0xe6,0xc2,0xa8,0xb1,0x4a,0x56,0x5a,0x2c,0x70,0x48,0xbf,0xb3,0xba,0x35,0x0a,0xac,0x9a,0xcb,0x34,0x5d])),
      )[0];

      const [subPDA] = deriveSubscriptionPDA(publicKey, merchantPub, USDC_MINT);

      const approveData = Buffer.alloc(9);
      approveData.writeUInt8(4, 0);
      approveData.writeBigUInt64LE(totalCap, 1);

      const approveIx = {
        programId: TOKEN_PROGRAM,
        data: approveData,
        accounts: [
          { pubkey: userATA, isSigner: false, isWritable: true },
          { pubkey: subPDA, isSigner: false, isWritable: false },
          { pubkey: publicKey, isSigner: true, isWritable: false },
        ],
      };

      const tx = new TransactionBuilder().addInstruction(approveIx);
      const result = await signAndSendAsync({ transaction: tx });
      setTxHash(result.signature);
      setStep("subscribe");
    } catch (e: any) {
      setError(e.message || "Approve failed");
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      if (!merchantPub || !publicKey) return;

      const USDC_MINT = new PublicKey(new Uint8Array([0x16,0x72,0xf4,0xc6,0x8e,0x5d,0x88,0x2a,0x8e,0x7a,0x07,0x56,0xcf,0x61,0x9f,0x09,0x14,0x7c,0x8d,0xb3,0xe0,0xd4,0x2a,0x62,0xcb,0x25,0x0b,0x2e]));

      const ix = createCreateSubscriptionInstruction(
        publicKey, merchantPub, USDC_MINT,
        amtBig, BigInt(parseInt(intervalDays) * 86400), BigInt(maxPayments),
      );

      const tx = new TransactionBuilder().addInstruction(ix);
      const result = await signAndSendAsync({ transaction: tx });
      setTxHash(result.signature);
      setStep("done");
    } catch (e: any) {
      setError(e.message || "Create subscription failed");
    }
    setLoading(false);
  };

  if (step === "done") {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h3>Subscription Created!</h3>
        <p style={{ fontSize: 14, color: "#666" }}>Tx: <code>{txHash.slice(0, 20)}...</code></p>
        <p>Your subscription is active. Payments execute automatically.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Create Subscription</h2>
      <div style={{ display: "grid", gap: 16, maxWidth: 400 }}>
        <label>Merchant Address
          <input value={merchant} onChange={(e) => setMerchant(e.target.value)}
            placeholder="Public key (base58)" style={{ width: "100%", padding: 8, marginTop: 4 }} />
        </label>
        <label>Amount per payment (USDC)
          <input value={amount} onChange={(e) => setAmount(e.target.value)}
            type="number" min="0" step="0.01" placeholder="10.00"
            style={{ width: "100%", padding: 8, marginTop: 4 }} />
        </label>
        <label>Interval (days)
          <input value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)}
            type="number" min="1" style={{ width: "100%", padding: 8, marginTop: 4 }} />
        </label>
        <label>Max payments
          <input value={maxPayments} onChange={(e) => setMaxPayments(e.target.value)}
            type="number" min="1" placeholder="12" style={{ width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        {step === "approve" && (
          <div style={{ background: "#f0f4ff", padding: 12, borderRadius: 8, fontSize: 14 }}>
            <p><strong>Approve spending cap</strong></p>
            <p>You're giving SubPay permission to spend up to{" "}
              <strong>{parseFloat(amount || "0") * parseInt(maxPayments || "1")} USDC</strong>
              {" "}over {maxPayments} payments.</p>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <input type="checkbox" /> I understand I can revoke this anytime.
            </label>
          </div>
        )}

        {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}

        <button onClick={step === "approve" ? handleApprove : handleSubscribe}
          disabled={loading || !merchant || !amount}
          style={{
            padding: "12px 24px", background: "#4361ee", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}>
          {loading ? "Confirming..." : step === "approve"
            ? `Step 1: Approve ${totalCap / 1_000_000n} USDC`
            : "Step 2: Create Subscription"}
        </button>
      </div>
    </div>
  );
}
