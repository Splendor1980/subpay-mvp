import { useState } from "react";
import { useWallet, ConnectButton } from "@rialo/frost";
import { CreateSubscription } from "./components/CreateSubscription";
import { SubscriptionList } from "./components/SubscriptionList";

type View = "landing" | "create" | "dashboard";

export default function App() {
  const { isConnected } = useWallet();
  const [view, setView] = useState<View>("landing");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>SubPay</h1>
        <ConnectButton />
      </header>

      {!isConnected && (
        <section style={{ textAlign: "center", padding: "80px 0" }}>
          <h2>Non-custodial Recurring Payments on Rialo</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            Connect your wallet to create, manage, and automate subscriptions.
            <br />
            Your funds never leave your wallet — payments are triggered
            automatically by Rialo Reactive Transactions.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setView("create")}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: "#4361ee",
                color: "#fff",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Try Demo
            </button>
          </div>
        </section>
      )}

      {isConnected && (
        <nav
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            borderBottom: "1px solid #e0e0e0",
            paddingBottom: 8,
          }}
        >
          <button
            onClick={() => setView("create")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: view === "create" ? "#4361ee" : "transparent",
              color: view === "create" ? "#fff" : "#333",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            + New Subscription
          </button>
          <button
            onClick={() => setView("dashboard")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: view === "dashboard" ? "#4361ee" : "transparent",
              color: view === "dashboard" ? "#fff" : "#333",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            My Subscriptions
          </button>
        </nav>
      )}

      {isConnected && view === "create" && <CreateSubscription />}
      {isConnected && view === "dashboard" && <SubscriptionList />}
    </div>
  );
}
