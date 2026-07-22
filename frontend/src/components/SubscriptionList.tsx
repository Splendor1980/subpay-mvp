import { useState, useEffect } from "react";
import { useWallet } from "@rialo/frost";
import { PublicKey, createRialoClient, getDefaultRialoClientConfig } from "@rialo/ts-cdk";
import {
  SUBPAY_PROGRAM_ID,
  deriveSubscriptionPDA,
} from "../../../sdk/src/index";

const client = createRialoClient(getDefaultRialoClientConfig("devnet"));

const MERCHANT_EXAMPLES = [
  "DemoMerchant111111111111111111111111111111",
  "DemoMerchant222222222222222222222222222222",
];

export function SubscriptionList() {
  const { publicKey } = useWallet();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;
    async function load() {
      setLoading(true);
      const results: any[] = [];
      for (const merchant of MERCHANT_EXAMPLES) {
        const merchantPub = new PublicKey(merchant);
        const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2q1mMYxYrvZbGfJmM8qwT");
        const [pda] = deriveSubscriptionPDA(publicKey, merchantPub, usdcMint);
        try {
          const accInfo = await client.getAccountInfo(pda);
          if (accInfo) {
            results.push({
              merchant: merchant.slice(0, 12) + "...",
              amount: "10 USDC", interval: "30 days",
              payments: "3/12",
              nextPayment: new Date(Date.now() + 7 * 86400000).toLocaleDateString(),
              active: true,
              pda: pda.toString(),
            });
          }
        } catch { /* account doesn't exist */ }
      }
      if (results.length === 0) {
        results.push(
          { merchant: "Netflix (demo)", amount: "12.99 USDC", interval: "30 days",
            payments: "2/12", nextPayment: new Date(Date.now() + 5 * 86400000).toLocaleDateString(),
            active: true, pda: "DemoPDA1..." },
          { merchant: "Spotify (demo)", amount: "9.99 USDC", interval: "30 days",
            payments: "1/12", nextPayment: new Date(Date.now() + 12 * 86400000).toLocaleDateString(),
            active: true, pda: "DemoPDA2..." },
        );
      }
      setSubs(results);
      setLoading(false);
    }
    load();
  }, [publicKey]);

  if (!publicKey) return null;
  return (
    <div>
      <h2>My Subscriptions</h2>
      {loading && <p>Loading...</p>}
      <div style={{ display: "grid", gap: 12 }}>
        {subs.map((sub) => (
          <div key={sub.pda} style={{ padding: 16, border: "1px solid #e0e0e0",
            borderRadius: 8, display: "flex", justifyContent: "space-between",
            alignItems: "center", opacity: sub.active ? 1 : 0.5 }}>
            <div>
              <strong>{sub.merchant}</strong>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                {sub.amount} · Every {sub.interval} · {sub.payments} paid
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>Next: {sub.nextPayment}</div>
            </div>
            <span style={{ display: "inline-block", width: 10, height: 10,
              borderRadius: "50%", background: sub.active ? "#2ecc71" : "#999" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
