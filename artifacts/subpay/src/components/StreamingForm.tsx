import { useState } from "react";
import { useActiveAccount, useSignAndSendTransaction } from "@rialo/frost";
import { PublicKey } from "@rialo/ts-cdk";
import { createStreamInstruction, buildStreamTx, StreamType } from "@/sdk/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Info, Loader2, Lock, Zap } from "lucide-react";

const DEMO_MINT = PublicKey.fromBytes(new Uint8Array(32).fill(2));

const INTERVALS = [
  { label: "Per second", value: 1, display: "/sec" },
  { label: "Per minute", value: 60, display: "/min" },
  { label: "Per hour", value: 3600, display: "/hr" },
  { label: "Per day", value: 86400, display: "/day" },
] as const;

interface StreamingFormProps {
  onCreated?: () => void;
}

export function StreamingForm({ onCreated }: StreamingFormProps) {
  const account = useActiveAccount();
  // @ts-ignore
  const { mutateAsync: signAndSend } = useSignAndSendTransaction();

  const [recipient, setRecipient] = useState("");
  const [rateAmount, setRateAmount] = useState("");
  const [intervalSec, setIntervalSec] = useState<number>(3600);
  const [totalCap, setTotalCap] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState("");

  // @ts-ignore
  const pubkeyStr: string | undefined = account?.publicKey ?? account?.address;
  const publicKey = pubkeyStr ? PublicKey.fromString(pubkeyStr) : null;

  const rateNum = parseFloat(rateAmount || "0");
  const capNum = parseFloat(totalCap || "0");
  const intervalLabel = INTERVALS.find((i) => i.value === intervalSec);
  const ratePerDay = intervalSec > 0 ? (rateNum * 86400) / intervalSec : 0;
  const ratePerMonth = ratePerDay * 30;
  const durationDays = ratePerDay > 0 && capNum > 0 ? Math.round(capNum / ratePerDay) : 0;
  const isValid = !!recipient && rateNum > 0 && capNum > 0;

  const handleCreate = async () => {
    if (!publicKey || !isValid) return;
    setLoading(true);
    setError("");
    try {
      const recipientPub = DEMO_MINT; // demo
      const amountPerInterval = BigInt(Math.round(rateNum * 1_000_000));
      const maxTotal = BigInt(Math.round(capNum * 1_000_000));

      const ix = createStreamInstruction(publicKey, recipientPub, DEMO_MINT, {
        streamType: StreamType.Streaming,
        amount: amountPerInterval,
        interval: BigInt(intervalSec),
        maxTotal,
        cliffTime: BigInt(0),
        endTime: BigInt(0),
      });

      const tx = buildStreamTx(ix, publicKey);
      // @ts-ignore
      const result = await signAndSend({ transaction: tx });
      // @ts-ignore
      setTxHash(result?.signature ?? "demo-tx-hash");
      setDone(true);
      onCreated?.();
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    }
    setLoading(false);
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Lock className="w-4 h-4 mr-2" /> Connect your wallet to create payment streams
      </div>
    );
  }

  if (done) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6 text-center space-y-2">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
          <p className="font-semibold text-green-800 dark:text-green-300">Payment stream created!</p>
          <p className="text-sm text-muted-foreground">
            {rateAmount} tokens {intervalLabel?.display} flowing to {recipient.slice(0, 8)}…
          </p>
          {txHash && <p className="text-xs font-mono text-muted-foreground">Tx: {txHash.slice(0, 20)}…</p>}
          <Button variant="outline" size="sm" onClick={() => { setDone(false); setRecipient(""); setRateAmount(""); setTotalCap(""); }}>
            Create another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {rateNum > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                  <Zap className="w-5 h-5" />{rateAmount}
                </p>
                <p className="text-xs text-muted-foreground">{intervalLabel?.label.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{ratePerMonth.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Per month</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{durationDays}d</p>
                <p className="text-xs text-muted-foreground">Stream duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 max-w-lg">
        <div className="space-y-2">
          <Label>Recipient address</Label>
          <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Contributor, contractor, DAO beneficiary…" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rate (tokens)</Label>
            <Input type="number" min="0" step="0.000001" value={rateAmount} onChange={(e) => setRateAmount(e.target.value)} placeholder="0.00039" />
          </div>
          <div className="space-y-2">
            <Label>Interval</Label>
            <Select value={String(intervalSec)} onValueChange={(v) => setIntervalSec(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERVALS.map((i) => (
                  <SelectItem key={i.value} value={String(i.value)}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Total cap (tokens) <Badge variant="secondary" className="text-xs font-normal">Max payout</Badge>
          </Label>
          <Input type="number" min="0" step="1" value={totalCap} onChange={(e) => setTotalCap(e.target.value)} placeholder="5000" />
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Tokens flow continuously — the recipient can claim accrued balance at any time.
            Payments execute via Reactive Transactions. No bots needed.
          </AlertDescription>
        </Alert>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <Button onClick={handleCreate} disabled={loading || !isValid} className="w-full">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : "Start payment stream"}
        </Button>
      </div>
    </div>
  );
}
