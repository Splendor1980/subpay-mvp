import { useState, useEffect, useRef } from "react";
import { useActiveAccount } from "@rialo/frost";
import { PublicKey } from "@rialo/ts-cdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Lock, TrendingUp, Zap, RefreshCw, XCircle } from "lucide-react";

interface DemoStream {
  id: string;
  type: "vesting" | "streaming" | "subscription";
  recipient: string;
  totalAmount: number;
  paidAmount: number;
  ratePerSec?: number;       // streaming only
  cliffDate?: Date;          // vesting only
  endDate?: Date;            // vesting only
  startedAt: number;         // unix ms
  active: boolean;
  nextPayment?: Date;        // subscription only
}

const INITIAL_STREAMS: DemoStream[] = [
  {
    id: "vesting-1",
    type: "vesting",
    recipient: "TeamFounder7xKm…",
    totalAmount: 100_000,
    paidAmount: 18_500,
    cliffDate: new Date("2024-07-01"),
    endDate: new Date("2026-07-01"),
    startedAt: Date.now() - 86_400_000 * 180,
    active: true,
  },
  {
    id: "vesting-2",
    type: "vesting",
    recipient: "InvestorRnd3Bq8…",
    totalAmount: 250_000,
    paidAmount: 62_500,
    cliffDate: new Date("2025-01-01"),
    endDate: new Date("2027-01-01"),
    startedAt: Date.now() - 86_400_000 * 90,
    active: true,
  },
  {
    id: "stream-1",
    type: "streaming",
    recipient: "ContribDevAbc…",
    totalAmount: 5_000,
    paidAmount: 1_234.56,
    ratePerSec: 0.00039,
    startedAt: Date.now() - 86_400_000 * 36,
    active: true,
  },
  {
    id: "stream-2",
    type: "streaming",
    recipient: "DAOTreasury9Zq…",
    totalAmount: 10_000,
    paidAmount: 3_100.0,
    ratePerSec: 0.00120,
    startedAt: Date.now() - 86_400_000 * 29,
    active: true,
  },
  {
    id: "sub-1",
    type: "subscription",
    recipient: "MerchantSaaS…",
    totalAmount: 120,
    paidAmount: 36,
    startedAt: Date.now() - 86_400_000 * 90,
    active: true,
    nextPayment: new Date(Date.now() + 86_400_000 * 5),
  },
];

function typeLabel(t: DemoStream["type"]) {
  if (t === "vesting") return { label: "Vesting", icon: <Lock className="w-3 h-3" />, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" };
  if (t === "streaming") return { label: "Streaming", icon: <Zap className="w-3 h-3" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
  return { label: "Subscription", icon: <RefreshCw className="w-3 h-3" />, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" };
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function StreamCard({ stream, onCancel }: { stream: DemoStream; onCancel: (id: string) => void }) {
  const [liveAmount, setLiveAmount] = useState(stream.paidAmount);
  const animFrame = useRef<number | null>(null);
  const { label, icon, color } = typeLabel(stream.type);

  // Live counter for streaming type
  useEffect(() => {
    if (stream.type !== "streaming" || !stream.active || !stream.ratePerSec) return;
    const startPaid = stream.paidAmount;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newAmount = Math.min(stream.totalAmount, startPaid + elapsed * stream.ratePerSec!);
      setLiveAmount(newAmount);
      animFrame.current = requestAnimationFrame(tick);
    };
    animFrame.current = requestAnimationFrame(tick);
    return () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); };
  }, [stream]);

  const progress = Math.min(100, (liveAmount / stream.totalAmount) * 100);

  return (
    <Card className={`transition-opacity ${stream.active ? "" : "opacity-50"}`}>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
              {icon} {label}
            </span>
            <span className="text-sm font-medium text-foreground">{stream.recipient}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stream.active ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            {stream.active && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onCancel(stream.id)}
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {stream.type === "streaming"
                ? <span className="font-mono tabular-nums">{liveAmount.toFixed(4)}</span>
                : formatTokens(liveAmount)
              }
              {" "}/ {formatTokens(stream.totalAmount)} tokens
            </span>
            <span>{progress.toFixed(1)}%</span>
          </div>
        </div>

        {/* Footer details */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {stream.type === "streaming" && stream.ratePerSec && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              {stream.ratePerSec.toFixed(5)}/sec
            </span>
          )}
          {stream.type === "vesting" && stream.cliffDate && stream.endDate && (
            <>
              <span>Cliff: {stream.cliffDate.toLocaleDateString()}</span>
              <span>End: {stream.endDate.toLocaleDateString()}</span>
            </>
          )}
          {stream.type === "subscription" && stream.nextPayment && (
            <span>Next: {stream.nextPayment.toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StreamDashboard() {
  const account = useActiveAccount();
  const [streams, setStreams] = useState<DemoStream[]>(INITIAL_STREAMS);

  const publicKey = account?.address ? new PublicKey(account.address) : null;

  const handleCancel = (id: string) => {
    setStreams((prev) => prev.map((s) => s.id === id ? { ...s, active: false } : s));
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Lock className="w-4 h-4 mr-2" /> Connect your wallet to view your streams
      </div>
    );
  }

  const active = streams.filter((s) => s.active);
  const inactive = streams.filter((s) => !s.active);

  // Summary stats
  const totalVested = streams.filter(s => s.type === "vesting").reduce((a, s) => a + s.paidAmount, 0);
  const totalStreamed = streams.filter(s => s.type === "streaming").reduce((a, s) => a + s.paidAmount, 0);
  const totalLocked = streams.filter(s => s.type === "vesting" && s.active).reduce((a, s) => a + (s.totalAmount - s.paidAmount), 0);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Lock className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatTokens(totalLocked)}</p>
            <p className="text-xs text-muted-foreground">Still locked (vesting)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{formatTokens(totalVested)}</p>
            <p className="text-xs text-muted-foreground">Tokens vested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Zap className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatTokens(totalStreamed)}</p>
            <p className="text-xs text-muted-foreground">Tokens streamed</p>
          </CardContent>
        </Card>
      </div>

      {/* Active streams */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          Active streams
          <Badge variant="secondary">{active.length}</Badge>
        </p>
        {active.map((s) => (
          <StreamCard key={s.id} stream={s} onCancel={handleCancel} />
        ))}
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No active streams. Create a vesting or streaming schedule above.
          </p>
        )}
      </div>

      {/* Inactive streams */}
      {inactive.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Ended / cancelled
            <Badge variant="outline">{inactive.length}</Badge>
          </p>
          {inactive.map((s) => (
            <StreamCard key={s.id} stream={s} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
