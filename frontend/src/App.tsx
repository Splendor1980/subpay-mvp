import { useState } from "react";
import { useIsConnected, ConnectButton } from "@rialo/frost";
import { CreateSubscription } from "./components/CreateSubscription";
import { SubscriptionList } from "./components/SubscriptionList";

type View = "landing" | "create" | "dashboard";

export default function App() {
  const isConnected = useIsConnected();
  const [view, setView] = useState<View>("landing");

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>SubPay</h1>
          <span style={{
            background: "#e8f0fe",
            color: "#4361ee",
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            letterSpacing: 0.3,
          }}>
            devnet
          </span>
        </div>
        <ConnectButton />
      </header>

      {/* Landing (when not connected) */}
      {!isConnected && (
        <>
          {/* Hero */}
          <section style={{ textAlign: "center", padding: "48px 0 56px" }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, margin: "0 0 16px", lineHeight: 1.2 }}>
              Non-custodial Recurring Payments<br />on Rialo
            </h2>
            <p style={{ color: "#555", fontSize: 17, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.5 }}>
              Create subscriptions, stream salaries and vest tokens —
              all without custody. Payments fire automatically via
              Rialo Reactive Transactions.
            </p>
            <button
              onClick={() => setView("create")}
              style={{
                padding: "14px 32px",
                borderRadius: 10,
                border: "none",
                background: "#4361ee",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(67,97,238,0.35)",
              }}
            >
              Connect Wallet & Try Demo
            </button>
          </section>

          {/* Feature cards */}
          <section style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginBottom: 56,
          }}>
            {[
              {
                title: "Token Vesting",
                desc: "Cliff + linear unlock schedules for teams and investors. Fully on-chain.",
                badge: "Vesting",
                color: "#4361ee",
              },
              {
                title: "Real-time Streaming",
                desc: "Continuous salary or contributor payouts — rate x elapsed time every block.",
                badge: "Stream",
                color: "#3a0ca3",
              },
              {
                title: "Subscriptions",
                desc: "Classic recurring payments. Approve once, pay automatically every interval.",
                badge: "Recurring",
                color: "#4895ef",
              },
            ].map((f) => (
              <div key={f.title} style={{
                background: "#f8f9fc",
                border: "1px solid #e8eaf0",
                borderRadius: 14,
                padding: "24px 20px",
              }}>
                <div style={{
                  display: "inline-block",
                  background: f.color,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 6,
                  marginBottom: 14,
                  letterSpacing: 0.3,
                }}>
                  {f.badge}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{f.title}</h3>
                <p style={{ margin: 0, color: "#666", fontSize: 14, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </section>

          {/* How it works */}
          <section style={{ marginBottom: 56 }}>
            <h3 style={{ textAlign: "center", fontSize: 22, marginBottom: 28 }}>How it works</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}>
              {[
                { n: "1", t: "Connect wallet", d: "Use any Rialo-compatible wallet. No custodial keys." },
                { n: "2", t: "Approve spending cap", d: "Set max amount SubPay can pull. Revoke anytime." },
                { n: "3", t: "Create stream / sub", d: "Choose interval, amount or vesting schedule." },
                { n: "4", t: "Auto-execute", d: "Reactive Transaction fires payment when predicate is true." },
              ].map((s) => (
                <div key={s.n} style={{ textAlign: "center", padding: "16px 12px" }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#4361ee",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    fontWeight: 700,
                    fontSize: 15,
                  }}>{s.n}</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.t}</div>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.4 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Banner */}
          <div style={{
            background: "linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)",
            color: "#fff",
            borderRadius: 14,
            padding: "20px 28px",
            textAlign: "center",
            fontSize: 15,
            fontWeight: 500,
          }}>
            Powered by Rialo Reactive Transactions · Stake-for-Service gas
          </div>
        </>
      )}

      {/* Connected views */}
      {isConnected && (
        <>
          <nav style={{
            display: "flex",
            gap: 8,
            marginBottom: 28,
            borderBottom: "1px solid #e0e0e0",
            paddingBottom: 10,
          }}>
            <button
              onClick={() => setView("create")}
              style={{
                padding: "9px 18px",
                border: "none",
                background: view === "create" ? "#4361ee" : "transparent",
                color: view === "create" ? "#fff" : "#333",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              + New Subscription
            </button>
            <button
              onClick={() => setView("dashboard")}
              style={{
                padding: "9px 18px",
                border: "none",
                background: view === "dashboard" ? "#4361ee" : "transparent",
                color: view === "dashboard" ? "#fff" : "#333",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              My Subscriptions
            </button>
          </nav>
          {view === "create" && <CreateSubscription />}
          {view === "dashboard" && <SubscriptionList />}
          {(view === "landing" || !view) && <CreateSubscription />}
        </>
      )}
    </div>
  );
}
