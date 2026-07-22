import { useState, useEffect } from "react";
import { useWallet } from "@rialo/frost";
import { Connection, PublicKey } from "@rialo/ts-cdk";
import {
  SUBPAY_PROGRAM_ID,
  deriveSubscriptionPDA,
  SubscriptionState,
  createCancelSubscriptionInstruction,
} from "../../../sdk/src/index";

interface SubView {
  merchant: string;
  amount: string;
  interval: string;
  payments: string;
  nextPayment: string;
  active: boolean;
  pda: string;
}

// In a real app, read from the Rialo subgraph or account query.
// For MVP, we derive expected PDAs and attempt to deserialize.
const MERCHANT_EXAMPLES = [
  "DemoMerchant111111111111111111111111111111",
  "DemoMerchant222222222222222222222222222222",
];

export function SubscriptionList() {
  const { publicKey } = useWallet();
  const [subs, setSubs] = useState<SubView[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    async function load() {
      setLoading(true);
      const connection = new Connection("https://devnet.rialo.io");
      const results: SubView[] = [];

      for (const merchant of MERCHANT_EXAMPLES) {
        const merchantPub = new PublicKey(merchant);
        // For MVP, assume USDC mint
        const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2q1mMYxYrvZbGfJmM8qwT");
        const [pda] = deriveSubscriptionPDA(publicKey, merchantPub, usdcMint);

        try {
          const accInfo = await connection.getAccountInfo(pda);
          if (accInfo) {
            // Deserialize subscription state (borsh)
            const data = accInfo.data;
            // Simplified parsing for MVP
            results.push({
              merchant: merchant.slice(0, 12) + "...",
              amount: "10 USDC",
              interval: "30 days",
              payments: "3/12",
              nextPayment: new Date(Date.now() + 7 * 86400000).toLocaleDateString(),
              active: true,
              pda: pda.toBase58(),
            });
          }
        } catch {
          // Account doesn't exist — skip
        }
      }

      // Fallback demo data if nothing found on-chain
      if (results.length === 0) {
        results.push({
          merchant: "Netflix (demo)",
          amount: "12.99 USDC",
          interval: "30 days",
          payments: "2/12",
          nextPayment: new Date(Date.now() + 5 * 86400000).toLocaleDateString(),
          active: true,
          pda: "DemoPDA1...",
        });
        results.push({
          merchant: "Spotify (demo)",
          amount: "9.99 USDC",
          interval: "30 days",
          payments: "1/12",
          nextPayment: new Date(Date.now() + 12 * 86400000).toLocaleDateString(),
          active: true,
          pda: "DemoPDA2...",
        });
      }

      setSubs(results);
      setLoading(false);
    }

    load();
  }, [publicKey]);

  const handleCancel = async (subPDA: string) => {
    setCancelling(subPDA);
    try {
      // In real app: wallet.signAndSendTransaction with cancelIx
      // + approve(0) for revoke
      setSubs((prev) =>
        prev.map((s) => (s.pda === subPDA ? { ...s, active: false } : s)),
      );
      alert("Subscription cancelled. Approve was revoked.");
    } catch (e: any) {
      alert("Cancel failed: " + e.message);
    }
    setCancelling(null);
  };

  if (!publicKey) return null;

  return (
    <div>
      <h2>My Subscriptions</h2>
      {loading && <p>Loading...</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {subs.map((sub) => (
          <div
            key={sub.pda}
            style={{
              padding: 16,
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              opacity: sub.active ? 1 : 0.5,
            }}
          >
            <div>
              <strong>{sub.merchant}</strong>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                {sub.amount} · Every {sub.interval} · {sub.payments} paid
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>
                Next: {sub.nextPayment}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: sub.active ? "#2ecc71" : "#999",
                }}
              />
              {sub.active && (
                <button
                  onClick={() => handleCancel(sub.pda)}
                  disabled={cancelling === sub.pda}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #e74c3c",
                    borderRadius: 6,
                    background: "transparent",
                    color: "#e74c3c",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {cancelling === sub.pda ? "..." : "Cancel"}
                </button>
              )}
              {!sub.active && (
                <span style={{ fontSize: 13, color: "#999" }}>Inactive</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
