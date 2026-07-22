import { useState, useEffect } from "react";
import { useActiveAccount } from "@rialo/frost";
import { PublicKey } from "@rialo/ts-cdk";

interface SubView {
  merchant: string;
  amount: string;
  interval: string;
  payments: string;
  nextPayment: string;
  active: boolean;
  pda: string;
}

export function SubscriptionList() {
  const account = useActiveAccount();
  const [subs, setSubs] = useState<SubView[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // @ts-ignore
  const addrStr: string | undefined = account?.address ?? account?.publicKey;
  const publicKey = addrStr ? PublicKey.fromString(addrStr) : null;

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    setTimeout(() => {
      setSubs([
        {
          merchant: "Netflix (demo)",
          amount: "12.99 USDC",
          interval: "30 days",
          payments: "2/12",
          nextPayment: new Date(Date.now() + 5 * 86400000).toLocaleDateString(),
          active: true,
          pda: "DemoPDA1",
        },
        {
          merchant: "Spotify (demo)",
          amount: "9.99 USDC",
          interval: "30 days",
          payments: "1/12",
          nextPayment: new Date(Date.now() + 12 * 86400000).toLocaleDateString(),
          active: true,
          pda: "DemoPDA2",
        },
      ]);
      setLoading(false);
    }, 500);
  }, [publicKey?.toString()]);

  const handleCancel = (pda: string) => {
    setCancelling(pda);
    setSubs((prev) => prev.map((s) => (s.pda === pda ? { ...s, active: false } : s)));
    setCancelling(null);
  };

  if (!publicKey) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Subscriptions</h2>
      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
      <div className="grid gap-3">
        {subs.map((sub) => (
          <div key={sub.pda} style={{
            padding: 16, border: "1px solid var(--color-border)", borderRadius: 8,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            opacity: sub.active ? 1 : 0.5,
          }}>
            <div>
              <strong>{sub.merchant}</strong>
              <div style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginTop: 4 }}>
                {sub.amount} · Every {sub.interval} · {sub.payments} paid
              </div>
              <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
                Next: {sub.nextPayment}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                display: "inline-block", width: 10, height: 10,
                borderRadius: "50%", background: sub.active ? "#2ecc71" : "#999",
              }} />
              {sub.active && (
                <button onClick={() => handleCancel(sub.pda)} disabled={cancelling === sub.pda}
                  style={{
                    padding: "6px 12px", border: "1px solid #e74c3c",
                    borderRadius: 6, background: "transparent",
                    color: "#e74c3c", cursor: "pointer", fontSize: 13,
                  }}>
                  {cancelling === sub.pda ? "…" : "Cancel"}
                </button>
              )}
              {!sub.active && <span style={{ fontSize: 13, color: "#999" }}>Inactive</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
