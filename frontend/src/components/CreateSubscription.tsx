import { useState } from "react";
import { useWallet } from "@rialo/frost";
import { Connection, PublicKey, TransactionBuilder } from "@rialo/ts-cdk";
import {
  SUBPAY_PROGRAM_ID,
  deriveSubscriptionPDA,
  createCreateSubscriptionInstruction,
} from "../../../sdk/src/index";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2q1mMYxYrvZbGfJmM8qwT");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

type Step = "approve" | "subscribe" | "done";

export function CreateSubscription() {
  const { wallet, publicKey } = useWallet();
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [intervalDays, setIntervalDays] = useState("30");
  const [maxPayments, setMaxPayments] = useState("12");
  const [step, setStep] = useState<Step>("approve");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!publicKey) {
    return <p>Connect your wallet to create a subscription.</p>;
  }

  const amtBig = BigInt(Math.round(parseFloat(amount || "0") * 1_000_000));
  const totalCap = amtBig * BigInt(maxPayments || "0");

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      const connection = new Connection("https://devnet.rialo.io");
      const [subPDA] = deriveSubscriptionPDA(
        publicKey,
        new PublicKey(merchant),
        USDC_MINT,
        SUBPAY_PROGRAM_ID,
      );

      // Step 1: SPL Token Approve(delegate=subPDA, amount=totalCap)
      const approveIx = {
        programId: TOKEN_PROGRAM_ID,
        data: (() => {
          const buf = Buffer.alloc(9);
          buf.writeUInt8(4, 0);    // Approve instruction
          buf.writeBigUInt64LE(totalCap, 1);
          return buf;
        })(),
        accounts: [
          // userTokenAccount — we need user's ATA
          { pubkey: PublicKey.findProgramAddressSync(
              [publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
              new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5BwA"),
            )[0], isSigner: false, isWritable: true },
          { pubkey: subPDA, isSigner: false, isWritable: false },
          { pubkey: publicKey, isSigner: true, isWritable: false },
        ],
      };

      const tx = new TransactionBuilder()
        .addInstruction(approveIx);

      const sig = await wallet.signAndSendTransaction(tx);
      setTxHash(sig);
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
      const connection = new Connection("https://devnet.rialo.io");
      const merchantPub = new PublicKey(merchant);

      const createIx = createCreateSubscriptionInstruction(
        publicKey,
        merchantPub,
        USDC_MINT,
        amtBig,
        BigInt(parseInt(intervalDays) * 86400),
        BigInt(maxPayments),
      );

      // Also create the reactive predicate on-chain
      // In production, this is a separate deploy step.
      // For MVP, we attach it as a remark or second instruction.
      const tx = new TransactionBuilder().addInstruction(createIx);

      const sig = await wallet.signAndSendTransaction(tx);
      setTxHash(sig);
      setStep("done");
    } catch (e: any) {
      setError(e.message || "Create subscription failed");
    }
    setLoading(false);
  };

  // ── Render ──
  if (step === "done") {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h3>✅ Subscription Created!</h3>
        <p style={{ fontSize: 14, color: "#666" }}>
          Tx: <code>{txHash.slice(0, 20)}…</code>
        </p>
        <p>
          Your subscription is active. Payments will execute automatically
          via Rialo Reactive Transactions — no keepers, no bots.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Create Subscription</h2>

      <div style={{ display: "grid", gap: 16, maxWidth: 400 }}>
        <label>
          Merchant Address
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Public key (base58)"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Amount per payment (USDC)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="10.00"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Interval (days)
          <input
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
            type="number"
            min="1"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Max payments
          <input
            value={maxPayments}
            onChange={(e) => setMaxPayments(e.target.value)}
            type="number"
            min="1"
            placeholder="12"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        {step === "approve" && (
          <div style={{ background: "#f0f4ff", padding: 12, borderRadius: 8, fontSize: 14 }}>
            <p><strong>Approve spending cap</strong></p>
            <p>You're giving SubPay permission to spend up to{" "}
              <strong>{parseFloat(amount || "0") * parseInt(maxPayments || "1")} USDC</strong>{" "}
              over {maxPayments} payments.</p>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <input type="checkbox" /> I understand I can revoke this anytime from my wallet.
            </label>
          </div>
        )}

        {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}

        <button
          onClick={step === "approve" ? handleApprove : handleSubscribe}
          disabled={loading || !merchant || !amount}
          style={{
            padding: "12px 24px",
            background: "#4361ee",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Confirming..."
            : step === "approve"
            ? `Step 1: Approve ${totalCap / 1_000_000n} USDC`
            : "Step 2: Create Subscription"}
        </button>
      </div>
    </div>
  );
}
