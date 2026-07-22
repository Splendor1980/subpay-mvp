---
name: SubPay project context
description: Key facts about the SubPay app — tech stack, SDK patterns, on-chain types, known constraints
---

# SubPay project context

## What it is
Non-custodial recurring payments + vesting + streaming on Retium (blockchain, formerly called Rialo). Target: RWA and DAO use cases. Devnet only as of July 2026.

## Stack
- Frontend: `artifacts/subpay/` — Vite + React, shadcn/ui, `@rialo/frost` (wallet), `@rialo/ts-cdk` (tx builder)
- No backend — purely frontend; `artifacts/api-server` is NOT needed for SubPay and should stay stopped.
- SDK helpers: `artifacts/subpay/src/sdk/index.ts` (copied + extended from `.migration-backup/sdk/`)

## On-chain stream types (Rust enum discriminants)
- 0 = Subscription
- 1 = Streaming (real-time, per-second drip)
- 2 = Vesting (cliff + linear unlock)
- 3 = RwaDividend
- 4 = Treasury

## SDK — createStreamInstruction layout (Borsh)
`[discriminant:1=CreateStream, stream_type:1, amount:8LE, interval:8LE, max_total:8LE, cliff_time:8LE, end_time:8LE]`

**Why:** Must match the on-chain `SubPayInstruction::CreateStream` Borsh layout exactly.

## Known constraint
- `SUBPAY_PROGRAM_ID` is a placeholder (all bytes 0x01–0x20). Real program ID must be set after deployment.
- `@rialo/frost` and `@rialo/ts-cdk` installed in `artifacts/subpay/` as `dependencies` (not devDependencies).
- Vite config needs `resolve.conditions: ['browser', 'module', 'import']` for `@rialo` packages to bundle correctly.

## Docs
- Retium docs: https://docs.retium.org/ — minimal as of July 2026 (early testnet stage)
- GitHub: @RetiumChain
