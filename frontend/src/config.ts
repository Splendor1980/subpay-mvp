import { createConfig, getDefaultRialoClientConfig } from "@rialo/frost";

export const subpayConfig = createConfig({
  clientConfig: getDefaultRialoClientConfig("devnet"),
  // Stake-for-Service: gas automatically covered by staking yield
  // via the ServicePaymaster — no separate gas top-up needed.
});

/** Network chain identifier used by wallet standard. */
export const CHAIN = "rialo:devnet";
