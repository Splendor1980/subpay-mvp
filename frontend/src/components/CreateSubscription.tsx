import { useState } from "react";
import { useActiveAccount } from "@rialo/frost";

export function CreateSubscription() {
  const account = useActiveAccount();
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [intervalDays, setIntervalDays] = useState("30");
  const [maxPayments, setMaxPayments] = useState("12");
  const [step, setStep] = useState<"approve" | "subscribe" | "done">("approve");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isConnected = Boolean(account?.publicKey || account?.address);

  if (!isConnected) {
    return <p>Connect your wallet to create a subscription.</p>;
  }

  const amtNum = parseFloat(amount || "0");
  const maxPay = parseInt(maxPayments || "0", 10);
  const totalCap = amtNum * maxPay;

  const simulateTx = () =>
    "demo_" + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      // Demo mode: real on-chain approve requires deployed SubPay program + correct @rialo/ts-cdk API
      await new Promise((r) => setTimeout(r, 800));
      setTxHash(simulateTx());
      setStep("subscribe");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approve failed");
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 800));
      setTxHash(simulateTx());
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create subscription failed");
    }
    setLoading(false);
  };

  if (step === "done") {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h3>Subscription Created! (demo)</h3>
        <p style={{ fontSize: 14, color: "#666" }}>
          Tx: <code>{txHash.slice(0, 24)}...</code>
        </p>
        <p>Your subscription is active. Payments execute automatically.</p>
        <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>
          On-chain mode will work after SubPay program is deployed and SDK is aligned with @rialo/ts-cdk.
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
            <p>
              <strong>Approve spending cap</strong>
            </p>
            <p>
              You're giving SubPay permission to spend up to{" "}
              <strong>{totalCap.toFixed(2)} USDC</strong> over {maxPayments} payments.
            </p>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <input type="checkbox" /> I understand I can revoke this anytime.
            </label>
          </div>
        )}

        {error && (
          <p style={{ color: "red", fontSize: 14 }}>{error}</p>
        )}

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
              ? `Step 1: Approve ${totalCap.toFixed(2)} USDC`
              : "Step 2: Create Subscription"}
        </button>
      </div>
    </div>
  );
}
