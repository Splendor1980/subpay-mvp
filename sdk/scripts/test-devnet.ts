import {
  Keypair,
  PublicKey,
  createRialoClient,
  getDefaultRialoClientConfig,
} from "@rialo/ts-cdk";

const DEVNET_URL = "https://devnet.rialo.io";

async function main() {
  console.log("");
  console.log("============================================");
  console.log("  SubPay - Rialo Devnet Test");
  console.log("============================================");
  console.log("");

  // 1. Create client
  console.log("1. Connecting to Rialo devnet...");
  const config = getDefaultRialoClientConfig("devnet");
  const client = createRialoClient(config);
  console.log("   URL:", DEVNET_URL);
  console.log("");

  // 2. Generate wallet
  console.log("2. Generating new wallet...");
  const keypair = new Keypair();
  const pubkey = keypair.publicKey;
  console.log("   Public key:", pubkey.toBase58());
  console.log("");

  // 3. Check balance
  console.log("3. Checking balance...");
  try {
    const balance: any = await client.getBalance(pubkey);
    console.log("   Balance:", balance, "lamports");
  } catch (e: any) {
    console.log("   (getBalance not available)");
  }
  console.log("");

  // 4. Airdrop
  console.log("4. Requesting airdrop (1.0 RLO)...");
  try {
    const sig: any = await client.requestAirdrop(pubkey, 1_000_000_000);
    console.log("   Signature:", typeof sig === "string" ? sig : String(sig));
    console.log("   Success!");
  } catch (e: any) {
    console.log("   Airdrop:", e.message || "not available");
  }
  console.log("");

  // 5. Done
  console.log("============================================");
  console.log("  Test complete!");
  console.log("  Next: open frontend at localhost:5173");
  console.log("============================================");
}

main().catch((e) => console.error("Error:", e.message));
