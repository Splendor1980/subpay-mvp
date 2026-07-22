import { useState } from "react";
import { useActiveAccount, useSignAndSendTransaction } from "@rialo/frost";
import { PublicKey } from "@rialo/ts-cdk";
import {
  createStreamInstruction,
  deriveStreamPDA,
  buildStreamTx,
  StreamType,
} from "@/sdk/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Info, Loader2, Lock } from "lucide-react";

// Demo USDC mint (devnet placeholder)
const DEMO_MINT = PublicKey.fromBytes(new Uint8Array(32).fill(2));

export function CreateSubscription() {
  const account = useActiveAccount();
  // @ts-ignore — hook signature varies by frost version
  const { mutateAsync: signAndSendAsync } = useSignAndSendTransaction();

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [intervalDays, setIntervalDays] = useState("30");
  const [maxPayments, setMaxPayments] = useState("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState("");

  // @ts-ignore — account fields vary
  const pubkeyStr: string | undefined = account?.publicKey ?? account?.address;
  const publicKey = pubkeyStr ? PublicKey.fromString(pubkeyStr) : null;

  const amtBig = BigInt(Math.round(parseFloat(amount || "0") * 1_000_000));
  const totalCap = amtBig * BigInt(maxPayments || "0");

  const handleSubmit = async () => {
    if (!publicKey) return;
    setLoading(true);
    setError("");
    try {
      // In production: parse merchant as real public key
      const merchantPub = DEMO_MINT; // demo placeholder

      const ix = createStreamInstruction(publicKey, merchantPub, DEMO_MINT, {
        streamType: StreamType.Subscription,
        amount: amtBig,
        interval: BigInt(parseInt(intervalDays) * 86400),
        maxTotal: totalCap,
        cliffTime: BigInt(0),
        endTime: BigInt(0),
      });

      const tx = buildStreamTx(ix, publicKey);
      // @ts-ignore
      const result = await signAndSendAsync({ transaction: tx });
      // @ts-ignore
      setTxHash(result?.signature ?? "demo-tx-hash");
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    }
    setLoading(false);
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Lock className="w-4 h-4 mr-2" /> Connect your wallet to create subscriptions
      </div>
    );
  }

  if (done) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6 text-center space-y-2">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
          <p className="font-semibold text-green-800 dark:text-green-300">Subscription Created!</p>
          <p className="text-sm text-muted-foreground">
            {amount} USDC every {intervalDays} days · {maxPayments} payments total
          </p>
          {txHash && <p className="text-xs font-mono text-muted-foreground">Tx: {txHash.slice(0, 20)}…</p>}
          <Button variant="outline" size="sm" onClick={() => { setDone(false); setMerchant(""); setAmount(""); }}>
            Create another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label>Merchant address</Label>
        <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Public key (base58)" />
      </div>
      <div className="space-y-2">
        <Label>Amount per payment (USDC)</Label>
        <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10.00" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Interval (days)</Label>
          <Input type="number" min="1" value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Max payments</Label>
          <Input type="number" min="1" value={maxPayments} onChange={(e) => setMaxPayments(e.target.value)} placeholder="12" />
        </div>
      </div>

      {parseFloat(amount) > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Approving up to <strong>{(parseFloat(amount) * parseInt(maxPayments || "1")).toFixed(2)} USDC</strong> over {maxPayments} payments.
            You can revoke anytime.
          </AlertDescription>
        </Alert>
      )}

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Button onClick={handleSubmit} disabled={loading || !merchant || !amount} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming…</> : "Create subscription"}
      </Button>
    </div>
  );
}
