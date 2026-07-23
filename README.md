# SubPay — Streaming & Vesting for RWA & DAO

**SubPay** is a non-custodial cash-flow platform on Rialo.
Manage recurring payments, streaming, vesting, and RWA payouts
in a single contract. No bots or keepers — powered by Reactive Transactions.

## 🌐 Live Demo

**https://subpay-mvp-production.up.railway.app/**

Frontend is live (demo mode). Connect a wallet and try the Vesting / Stream / Subscription forms.

## Concept

One contract for all cash flows:

| Type | Example |
|---|---|
| **Recurring** | Monthly subscription (10 USDC / month) |
| **Streaming** | Continuous salary for contributors (0.00039 USDC / sec) |
| **Vesting** | Team token distribution (6-month cliff, 24-month vest) |
| **RWA Dividends** | Dividend payouts to RWA holders |
| **Treasury Stream** | Regular payouts from a DAO treasury (multisig) |

All scenarios run on a single mechanism: **Reactive Transaction**.
The predicate is checked every block — when the condition is true, `ExecutePayment` fires automatically.

## Architecture

```
subpay-mvp/
├── programs/subpay-core/      ← Rust program (SVM, RISC-V)
│   ├── lib.rs                 ← entrypoint
│   ├── instructions.rs        ← CreateStream, CancelStream, ExecutePayment
│   ├── state.rs               ← Stream (with StreamType), Subscription (deprecated)
│   └── errors.rs
├── sdk/                       ← TypeScript SDK
├── frontend/                  ← React + @rialo/frost + Caddy (Railway)
└── RWA/                       ← RWA scenario examples (coming later)
```

## Stream Types

```rust
pub enum StreamType {
    Subscription = 0,  // Classic subscription (fixed amount, interval)
    Streaming    = 1,  // Continuous flow (rate * delta_time)
    Vesting      = 2,  // Distribution (cliff + rate + cap + end)
    RwaDividend  = 3,  // RWA payouts (dividend_per_share * shares)
    Treasury     = 4,  // DAO treasury (multisig approval)
}
```

## Reactive Transactions

Predicates differ by type, but execution is always a single `ExecutePayment`:

```
Recurring:   paymentsMade < maxPayments && blockTime >= nextPaymentTime
Streaming:   blockTime - lastStreamTime >= 1
Vesting:     blockTime > cliffTime && totalStreamed < totalVested && blockTime < endTime
RWA:         dividendRegistered && userHasShares && !alreadyPaidThisRound
Treasury:    streamApproved && budgetRemaining > 0
```

## Tech Stack

| Component | Technology |
|---|---|
| **Blockchain** | Rialo (SVM, RISC-V, 50ms blocks) |
| **Gas** | Stake-for-Service (ServicePaymaster) |
| **Automation** | Reactive Transactions |
| **Security** | Threshold Cryptography / DKG (v2) |
| **Frontend** | React + @rialo/frost |
| **Frontend deploy** | Railway + Docker + Caddy |
| **On-chain** | Rust + rialo-s-program |
| **Tokens** | USDC / RWA tokens (Rialo Interop) |

## Current Roadmap

### Phase 0 — Foundation (done)
- [x] Rust program: CreateStream / CancelStream / ExecutePayment
- [x] Reactive Transaction predicate (scaffold)
- [x] TypeScript SDK (draft)
- [x] React UI — Vesting / Stream / Subscription forms
- [x] Demo mode (simulateTx)
- [x] Frontend deployed on Railway
- [x] Live Demo: https://subpay-mvp-production.up.railway.app/
- [x] README + positioning

### Phase 1 — Usable MVP (next priority)
- [ ] Deploy `subpay-core` to Rialo devnet
- [ ] Real on-chain calls via `@rialo/ts-cdk` (replace demo)
- [ ] Cliff + linear vesting fully on-chain
- [ ] Open-ended stream (salary with no end date)
- [ ] Cancel + clawback of remaining tokens
- [ ] Progress bar (unlocked %)
- [ ] Recipient view — "my streams / vestings"
- [ ] Shareable link for recipients

### Phase 2 — For teams
- [ ] Batch create from CSV (20–50 addresses)
- [ ] CEO dashboard (all streams, total committed, next unlocks)
- [ ] Top-up stream
- [ ] Pause / Resume
- [ ] Multiple tokens (not only USDC)

### Phase 3 — RWA + DAO
- [ ] StreamType: RwaDividend, Treasury
- [ ] 1-to-many distributions (dividends)
- [ ] One-click treasury stream
- [ ] Multisig / Threshold Cryptography
- [ ] Governance rights while vesting

### Phase 4 — Composability
- [ ] DKG for cross-chain payouts
- [ ] Compliance Primitive (RWA)
- [ ] Integration with Rialo Stream (native data feeds)
- [ ] Price-based vesting (oracles)

## Why Rialo Is the Advantage

Competitors (Sablier, Superfluid, Streamflow, LlamaPay, Hedgey) on EVM/Solana depend on keepers, bots, or a push-based claim model.

SubPay uses **Reactive Transactions** — the condition is checked by the blockchain itself. No external automators. This is the core differentiator.

## Deploy

### Frontend (already live)

Live: **https://subpay-mvp-production.up.railway.app/**

```bash
# Local
cd frontend
npm ci
npm run dev
```

### On-chain program

```bash
cd programs/subpay-core
cargo build-bpf --arch riscv64
rialo program deploy target/deploy/subpay-core.so \
  --url https://devnet.rialo.io \
  --keypair ~/subpay-keypair.json
```

## Links

- **Live Demo:** https://subpay-mvp-production.up.railway.app/
- **Rialo Ecosystem Map:** [ECOSYSTEM.md](./ECOSYSTEM.md) — niches taken vs open
- [Rialo Learn](https://learn.rialo.io/)
- [Reactive Transactions](https://learn.rialo.io/tutorials/reactive/)
- [Stake for Service](https://rialo.io/posts/stake-for-service)
- [DKG](https://rialo.io/posts/understanding-distributed-key-generation)
- [GitHub](https://github.com/Splendor1980/subpay-mvp)
