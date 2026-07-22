import { useState } from "react";
import { useActiveAccount, useSignAndSendTransaction } from "@rialo/frost";
import { PublicKey, TransactionBuilder, createRialoClient, getDefaultRialoClientConfig } from "@rialo/ts-cdk";
import {
  SUBPAY_PROGRAM_ID,
  deriveSubscriptionPDA,
  createCreateSubscriptionInstruction,
} from "../../../sdk/src/index";

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

  const publicKey = account?.address ? new PublicKey(account.address) : null;
  const merchantPub = merchant ? new PublicKey(merchant) : null;

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

      const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2q1mMYxYrvZbGfJmM8qwT");
      const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

      // Derive user's ATA
      const userATA = PublicKey.findProgramAddressSync(
        [publicKey.toBuffer(), TOKEN_PROGRAM.toBuffer(), USDC_MINT.toBuffer()],
        new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5BwA"),
      )[0];

      const [subPDA] = deriveSubscriptionPDA(publicKey, merchantPub, USDC_MINT);

      // Approve delegate instruction
      const approveData = Buffer.alloc(9);
      approveData.writeUInt8(4, 0);     // Approve tag
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

      const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2q1mMYxYrvZbGfJmM8qwT");

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
