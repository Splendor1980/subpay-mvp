# Rialo Ecosystem Niche Map

Community-maintained index of projects and open niches on **Rialo**.

Purpose: help builders and AI assistants answer “what already exists on Rialo?” and “what is still open?”.

> **Status legend**
> - **Live** — public app / mainnet or stable product
> - **Demo** — working on devnet / playground
> - **Building** — active repo, not yet public demo
> - **Open** — no known serious project

Last updated: 2026-07-23

---

## Payments & Cash Flows

| Niche | Status | Project(s) | Notes |
|-------|--------|------------|-------|
| Streaming payments | **Building** | [SubPay](https://github.com/Splendor1980/subpay-mvp) | Real-time token streams |
| Token vesting (cliff + linear) | **Building** | [SubPay](https://github.com/Splendor1980/subpay-mvp) | Team / investor schedules |
| Recurring subscriptions | **Building** | [SubPay](https://github.com/Splendor1980/subpay-mvp) | Fixed interval + max payments |
| Payroll / salary streams | **Open** | — | Natural fit for Reactive Transactions |
| Invoice / pay-on-delivery | **Open** | — | Combine with real-world data feeds |

**Live demo (SubPay frontend):** https://subpay-mvp-production.up.railway.app/

---

## DeFi & Vaults

| Niche | Status | Project(s) | Notes |
|-------|--------|------------|-------|
| Stablecoin + compliance | **Demo** | Meridian (Playground) | Programmable compliance |
| Multisig / guarded vault | **Demo** | Guarded Vault (Playground) | Time-locks + guardians |
| Lending / borrowing | **Open** | — | |
| DEX / AMM | **Open** | — | Reactive params possible |
| Yield vaults | **Open** | — | |
| Perps / derivatives | **Open** | — | |

Playground: https://playground.rialo.io/

---

## RWA & Tokenization

| Niche | Status | Project(s) | Notes |
|-------|--------|------------|-------|
| RWA issuance / servicing | **Open** | — | Rialo enterprise track exists |
| RWA dividends / distributions | **Open** | — | Fits 1-to-many Reactive flows |
| Cap table / investor lockups | **Open** | — | Adjacent to vesting |
| Compliance-native assets | **Demo** | Meridian-related | |

---

## Automation & Agents

| Niche | Status | Project(s) | Notes |
|-------|--------|------------|-------|
| Reactive / conditional execution | **Native** | Rialo core | Built into the chain |
| Insurance triggers (e.g. flight delay) | **Mentioned** | Examples only | Strong open niche |
| Logistics / pay-on-arrival | **Mentioned** | Examples only | IoT + Reactive |
| AI agent gateways / harness | **Building** | Rialo Agents | agents.rialo.io |
| Scheduled / cron-like jobs | **Native** | Reactive Transactions | No external keepers |

---

## Infra & Tooling

| Niche | Status | Project(s) | Notes |
|-------|--------|------------|-------|
| Indexer / explorer | **Open** | — | High value early |
| Wallet standard / connectors | **Building** | @rialo/frost | Used by SubPay |
| SDK / CDK | **Building** | @rialo/ts-cdk | |
| Oracle / data feeds | **Native + Open** | Rialo Stream | App-level products open |
| Bridge / interop | **Open** | — | |

---

## Open niches (priority ideas)

High fit for Rialo’s Reactive Transactions + real-world data:

1. **On-chain payroll** — salary streams with auto top-up / revoke  
2. **Parametric insurance** — pay out when external condition is true  
3. **RWA dividend distributor** — 1-to-many on schedule or event  
4. **Treasury automation for DAOs** — recurring + multisig gates  
5. **Subscription access control** — unlock content/API while stream is active  
6. **Explorer + portfolio tracker** for Rialo accounts and Reactive jobs  

---

## How to contribute

1. Open a PR on this file or an issue in [subpay-mvp](https://github.com/Splendor1980/subpay-mvp).
2. Add: niche, status, project name, link, one-line note.
3. Prefer public repos or live demos only.

This map is community-maintained and not an official Rialo product list.

---

## Related

- SubPay: https://github.com/Splendor1980/subpay-mvp  
- Live demo: https://subpay-mvp-production.up.railway.app/  
- Rialo: https://rialo.io/  
- Playground: https://playground.rialo.io/  
- Docs / Learn: https://learn.rialo.io/  
