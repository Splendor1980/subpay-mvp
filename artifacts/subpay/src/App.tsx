import { useState } from "react";
import { useIsConnected, ConnectButton } from "@rialo/frost";
import { VestingForm } from "@/components/VestingForm";
import { StreamingForm } from "@/components/StreamingForm";
import { StreamDashboard } from "@/components/StreamDashboard";
import { CreateSubscription } from "@/components/CreateSubscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Zap, RefreshCw, LayoutDashboard, ChevronRight } from "lucide-react";

function LandingHero({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 gap-8">
      {/* Logo / brand */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Powered by Retium Reactive Transactions
        </div>
        <h1 className="text-5xl font-bold tracking-tight">SubPay</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Non-custodial recurring payments, vesting, and streaming for RWA&nbsp;&amp;&nbsp;DAO
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-3 justify-center">
        {[
          { icon: <Lock className="w-3.5 h-3.5" />, label: "Token Vesting", desc: "Cliff + gradual unlock" },
          { icon: <Zap className="w-3.5 h-3.5" />, label: "Real-time Streaming", desc: "Pay per second" },
          { icon: <RefreshCw className="w-3.5 h-3.5" />, label: "Subscriptions", desc: "Recurring billing" },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="flex items-start gap-2 bg-card border rounded-xl px-4 py-3 text-left w-44">
            <span className="mt-0.5 text-primary">{icon}</span>
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
        Connect wallet
        <ChevronRight className="w-3 h-3" />
        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
        Approve once
        <ChevronRight className="w-3 h-3" />
        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
        Payments run automatically
      </div>

      <ConnectButton />

      <p className="text-xs text-muted-foreground max-w-sm">
        Your funds never leave your wallet — payments are triggered automatically
        by Reactive Transactions. No bots, no keepers.
      </p>
    </div>
  );
}

export default function App() {
  const isConnected = useIsConnected();
  const [tab, setTab] = useState("dashboard");

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight">SubPay</span>
            <Badge variant="secondary" className="text-xs">devnet</Badge>
          </div>
          <ConnectButton />
        </header>
        <LandingHero onConnect={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b px-6 py-3 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">SubPay</span>
          <Badge variant="secondary" className="text-xs">devnet</Badge>
        </div>
        <ConnectButton />
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="vesting" className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Vesting
            </TabsTrigger>
            <TabsTrigger value="streaming" className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Streaming
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Subscriptions
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-semibold">Your Streams</h2>
              <p className="text-sm text-muted-foreground">
                All active vesting schedules, payment streams, and subscriptions in one place.
              </p>
            </div>
            <StreamDashboard />
          </TabsContent>

          {/* Vesting */}
          <TabsContent value="vesting" className="mt-0">
            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5 text-violet-500" /> Token Vesting
              </h2>
              <p className="text-sm text-muted-foreground">
                Gradually unlock tokens by schedule — ideal for team allocations, investor rounds, and DAO grants.
                Set a cliff date and an end date; tokens unlock linearly in between.
              </p>
            </div>
            <VestingForm onCreated={() => setTab("dashboard")} />
          </TabsContent>

          {/* Streaming */}
          <TabsContent value="streaming" className="mt-0">
            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" /> Real-time Streaming
              </h2>
              <p className="text-sm text-muted-foreground">
                Tokens flow continuously — contributors receive their share every second.
                Perfect for DAO salaries, bounty payouts, and treasury distributions.
              </p>
            </div>
            <StreamingForm onCreated={() => setTab("dashboard")} />
          </TabsContent>

          {/* Subscriptions */}
          <TabsContent value="subscription" className="mt-0">
            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" /> Subscriptions
              </h2>
              <p className="text-sm text-muted-foreground">
                Fixed recurring payments on a defined interval — daily, weekly, or monthly.
                One approval, automatic execution via Reactive Transactions.
              </p>
            </div>
            <CreateSubscription />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
