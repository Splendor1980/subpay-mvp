import { useState } from "react";
import { useActiveAccount } from "@rialo/frost";

export type FormType = "vesting" | "stream" | "subscription";

interface Props {
  type?: FormType;
}

export function CreateSubscription({ type = "subscription" }: Props) {
  const account = useActiveAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [intervalDays, setIntervalDays] = useState("30");
  const [maxPayments, setMaxPayments] = useState("12");
  const [cliffDays, setCliffDays] = useState("90");
  const [durationMonths, setDurationMonths] = useState("12");
  const [ratePerDay, setRatePerDay] = useState("");
  const [step, setStep] = useState<"approve" | "create" | "done">("approve");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isConnected = Boolean(account?.publicKey || account?.address);

  if (!isConnected) {
    return (
      <p style={{ color: "#666" }}>
        Connect your wallet to create a {type === "vesting" ? "vesting schedule" : type === "stream" ? "stream" : "subscription"}.
      </p>
    );
  }

  const amtNum = parseFloat(amount || "0");
  const maxPay = parseInt(maxPayments || "0", 10);
  const totalCap =
    type === "subscription"
      ? amtNum * maxPay
      : type === "stream"
        ? parseFloat(ratePerDay || "0") * 365
        : amtNum;

  const simulateTx = () =>
    "demo_" + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);

  const titles: Record<FormType, string> = {
    vesting: "Create Token Vesting",
    stream: "Create Real-time Stream",
    subscription: "Create Subscription",
  };

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 700));
      setTxHash(simulateTx());
      setStep("create");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approve failed");
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 700));
      setTxHash(simulateTx());
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
    setLoading(false);
  };

  if (step === "done") {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h3 style={{ color: "#2ecc71" }}>
          {type === "vesting"
            ? "Vesting Schedule Created! (demo)"
            : type === "stream"
              ? "Stream Created! (demo)"
              : "Subscription Created! (demo)"}
        </h3>
        <p style={{ fontSize: 14, color: "#666" }}>
          Tx: <code>{txHash.slice(0, 28)}...</code>
        </p>
        <p style={{ marginTop: 8 }}>
          {type === "vesting"
            ? "Tokens will unlock according to the schedule. Fully non-custodial."
            : type === "stream"
              ? "Tokens stream continuously. Recipient can withdraw at any time."
              : "Payments will execute automatically every interval."}
        </p>
        <p style={{ fontSize: 13, color: "#888", marginTop: 16 }}>
          Demo mode. Real on-chain calls will work after SubPay program is deployed on Rialo devnet.
        </p>
        <button
          onClick={() => {
            setStep("approve");
            setTxHash("");
            setRecipient("");
            setAmount("");
          }}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            border: "1px solid #4361ee",
            borderRadius: 8,
            background: "transparent",
            color: "#4361ee",
            cursor: "pointer",
          }}
        >
          Create another
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>{titles[type]}</h2>
      <div style={{ display: "grid", gap: 16, maxWidth: 440 }}>
        <label>
          Recipient Address
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Public key (base58)"
            style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
          />
        </label>

        {type === "vesting" && (
          <>
            <label>
              Total amount (tokens)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="100000"
                style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </label>
            <label>
              Cliff (days until unlock starts)
              <input
                value={cliffDays}
                onChange={(e) => setCliffDays(e.target.value)}
                type="number"
                min="0"
                style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </label>
            <label>
              Vesting duration (months)
              <input
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                type="number"
                min="1"
                style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </label>
            <div style={{ background: "#f8f9fc", padding: 12, borderRadius: 8, fontSize: 13, color: "#555" }}>
              Linear unlock after cliff. Example: 90-day cliff + 12 months → tokens unlock evenly over the year after cliff ends.
            </div>
          </>
        )}

        {type === "stream" && (
          <>
            <label>
              Rate per day (tokens)
              <input
                value={ratePerDay}
                onChange={(e) => setRatePerDay(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="50.00"
                style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </label>
            <label>
              Duration (days, optional — leave empty for open-ended)
              <input
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                type="number"
                min="1"
                placeholder="365"
                style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </label>
            <div style={{ background: "#f8f9fc", padding: 12, borderRadius: 8, fontSize: 13, color: "#555" }}>
              Continuous streaming. Recipient can withdraw accrued tokens at any time. Rate × elapsed time.
            </div>
          </>
        )}

        {type === "subscription" && (
          <>
            <label>
              Amount per payment (USDC)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="10.00"
                style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </label>
            <label>
              Interval (days)
              <input
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                type="number"
                min="1"
                style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
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
                style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </label>
          </>
        )}

        {step === "approve" && (
          <div style={{ background: "#f0f4ff", padding: 14, borderRadius: 8, fontSize: 14 }}>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Approve spending cap</strong>
            </p>
            <p style={{ margin: 0 }}>
              You're giving SubPay permission to move up to{" "}
              <strong>{totalCap > 0 ? totalCap.toFixed(2) : "—"} tokens</strong>.
              You keep full control — revoke anytime. Non-custodial.
            </p>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
              <input type="checkbox" defaultChecked /> I understand I can revoke this anytime.
            </label>
          </div>
        )}

        {error && <p style={{ color: "#e74c3c", fontSize: 14 }}>{error}</p>}

        <button
          onClick={step === "approve" ? handleApprove : handleCreate}
          disabled={
            loading ||
            !recipient ||
            (type === "vesting" && !amount) ||
            (type === "stream" && !ratePerDay) ||
            (type === "subscription" && !amount)
          }
          style={{
            padding: "12px 24px",
            background: "#4361ee",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Confirming..."
            : step === "approve"
              ? `Step 1: Approve ${totalCap > 0 ? totalCap.toFixed(2) : ""} tokens`
              : type === "vesting"
                ? "Step 2: Create Vesting Schedule"
                : type === "stream"
                  ? "Step 2: Start Stream"
                  : "Step 2: Create Subscription"}
        </button>
      </div>
    </div>
  );
}
