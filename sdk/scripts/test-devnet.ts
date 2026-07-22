import { RialoKeyring, Connection } from "@rialo/ts-cdk";

const DEVNET_URL = "https://devnet.rialo.io";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("SubPay - Rialo Devnet Test");
  console.log("");

  // 1. Connect
  console.log("Connecting to Rialo devnet...");
  const connection = new Connection(DEVNET_URL);
  console.log("  URL:", DEVNET_URL);

  // 2. Generate wallet
  console.log("\nGenerating new wallet...");
  const keyring = new RialoKeyring();
  const pubkey = keyring.publicKey;
  console.log("  Public key:", pubkey.toBase58());

  // 3. Check balance
  let balance = 0n;
  try {
    balance = await connection.getBalance(pubkey);
    console.log("  Balance:", balance, "lamports");
  } catch (e: any) {
    console.log("  getBalance failed:", e.message.slice(0, 80));
  }

  // 4. Airdrop
  console.log("\nRequesting airdrop (1 RLO)...");
  try {
    const sig = await connection.requestAirdrop(pubkey, 1_000_000_000);
    console.log("  Airdrop signature:", sig.slice(0, 16), "...");

    console.log("  Waiting for confirmation...");
    await sleep(3000);

    const newBalance = await connection.getBalance(pubkey);
    console.log("  Balance after:", newBalance, "lamports");

    if (newBalance > balance) {
      console.log("\n  DEVNET IS WORKING!");
    }
  } catch (e: any) {
    console.log("  Airdrop attempted:", e.message.slice(0, 100));
    console.log("  This is OK - RPC endpoint may still work.");
  }

  // 5. Summary
  console.log("\n--- Summary ---");
  console.log("Wallet:", pubkey.toBase58());
  console.log("Network:", DEVNET_URL);
  console.log("");
}

main().catch(console.error);
