import { useState } from "react";
import { useActiveAccount, useSignAndSendTransaction } from "@rialo/frost";
import { PublicKey } from "@rialo/ts-cdk";
import { createStreamInstruction, buildStreamTx, StreamType } from "@/sdk/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Info, Loader2, Lock } from "lucide-react";

const DEMO_MINT = PublicKey.fromBytes(new Uint8Array(32).fill(2));

interface VestingFormProps {
  onCreated?: () => void;
}

export function VestingForm({ onCreated }: VestingFormProps) {
  const account = useActiveAccount();
  // @ts-ignore
  const { mutateAsync: signAndSend } = useSignAndSendTransaction();

  const [recipient, setRecipient] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [cliffDate, setCliffDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 24);
    return d.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState("");

  // @ts-ignore
  const pubkeyStr: string | undefined = account?.publicKey ?? account?.address;
  const publicKey = pubkeyStr ? PublicKey.fromString(pubkeyStr) : null;

  const totalAmountNum = parseFloat(totalAmount || "0");
  const cliffMs = new Date(cliffDate).getTime();
  const endMs = new Date(endDate).getTime();
  const vestingDays = Math.max(0, Math.round((endMs - cliffMs) / 86_400_000));
  const cliffSec = BigInt(Math.floor(cliffMs / 1000));
  const endSec = BigInt(Math.floor(endMs / 1000));
  const monthlyAmount = vestingDays > 0 ? (totalAmountNum / (vestingDays / 30)).toFixed(0) : "0";
  const isValid = !!recipient && totalAmountNum > 0 && cliffMs > 0 && endMs > cliffMs;

  const handleCreate = async () => {
    if (!publicKey || !isValid) return;
    setLoading(true);
    setError("");
    try {
      const recipientPub = DEMO_MINT; // demo — replace with PublicKey.fromString(recipient) in prod
      const totalTokens = BigInt(Math.round(totalAmountNum * 1_000_000));

      const ix = createStreamInstruction(publicKey, recipientPub, DEMO_MINT, {
        streamType: StreamType.Vesting,
        amount: BigInt(0),
        interval: BigInt(86400),
        maxTotal: totalTokens,
        cliffTime: cliffSec,
        endTime: endSec,
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
        <Lock className="w-4 h-4 mr-2" /> Connect your wallet to create vesting streams
      </div>
    );
  }

  if (done) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6 text-center space-y-2">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
          <p className="font-semibold text-green-800 dark:text-green-300">Vesting schedule created!</p>
          <p className="text-sm text-muted-foreground">
            {totalAmount} tokens vesting to {recipient.slice(0, 8)}… over {vestingDays} days
          </p>
          {txHash && <p className="text-xs font-mono text-muted-foreground">Tx: {txHash.slice(0, 20)}…</p>}
          <Button variant="outline" size="sm" onClick={() => { setDone(false); setRecipient(""); setTotalAmount(""); }}>
            Create another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {totalAmountNum > 0 && vestingDays > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{totalAmount}</p>
                <p className="text-xs text-muted-foreground">Total tokens</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{vestingDays}d</p>
                <p className="text-xs text-muted-foreground">Vesting period</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">~{monthlyAmount}</p>
                <p className="text-xs text-muted-foreground">Per month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 max-w-lg">
        <div className="space-y-2">
          <Label>Recipient address</Label>
          <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Base58 public key (team member, investor…)" />
        </div>
        <div className="space-y-2">
          <Label>Total amount (tokens)</Label>
          <Input type="number" min="0" step="1" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="100000" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Cliff date <Badge variant="secondary" className="text-xs font-normal">Vesting starts</Badge>
            </Label>
            <Input type="date" value={cliffDate} onChange={(e) => setCliffDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              End date <Badge variant="secondary" className="text-xs font-normal">Fully vested</Badge>
            </Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Tokens unlock linearly from cliff to end date. The recipient claims at any time — no bots or keepers.
          </AlertDescription>
        </Alert>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <Button onClick={handleCreate} disabled={loading || !isValid} className="w-full">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : "Create vesting schedule"}
        </Button>
      </div>
    </div>
  );
}
