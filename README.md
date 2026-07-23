# SubPay — Streaming & Vesting for RWA & DAO

**SubPay** — некастодиальная платформа денежных потоков на Rialo.
Управление recurring payments, streaming, vesting и RWA-выплатами
в одном контракте. Без ботов и киперов — через Reactive Transactions.

## 🌐 Live Demo

**https://subpay-mvp-production.up.railway.app/**

Frontend уже работает (demo-режим). Подключай кошелёк и тестируй формы Vesting / Stream / Subscription.

## Концепция

Один контракт для всех денежных потоков:

| Тип | Пример |
|---|---|
| **Recurring** | Ежемесячная подписка (10 USDC / мес) |
| **Streaming** | Непрерывная зарплата контрибьюторам (0.00039 USDC / сек) |
| **Vesting** | Распределение токенов команде (cliff 6 мес, vesting 24 мес) |
| **RWA Dividends** | Выплата дивидендов держателям RWA |
| **Treasury Stream** | Регулярные выплаты из DAO-сокровищницы (мультиподпись) |

Все сценарии работают на одном механизме: **Reactive Transaction**.
Predicate проверяется каждый блок — когда условие истинно, `ExecutePayment` срабатывает автоматически.

## Архитектура

```
subpay-mvp/
├── programs/subpay-core/      ← Rust-программа (SVM, RISC-V)
│   ├── lib.rs                 ← entrypoint
│   ├── instructions.rs        ← CreateStream, CancelStream, ExecutePayment
│   ├── state.rs               ← Stream (с StreamType), Subscription (deprecated)
│   └── errors.rs
├── sdk/                       ← TypeScript SDK
├── frontend/                  ← React + @rialo/frost + Caddy (Railway)
└── RWA/                       ← примеры RWA-сценариев (добавятся позже)
```

## Stream типы

```rust
pub enum StreamType {
    Subscription = 0,  // Классическая подписка (фикс. сумма, интервал)
    Streaming    = 1,  // Непрерывный поток (rate * delta_time)
    Vesting      = 2,  // Распределение (cliff + rate + cap + end)
    RwaDividend  = 3,  // RWA-выплаты (dividend_per_share * shares)
    Treasury     = 4,  // DAO-казначейство (multisig approval)
}
```

## Reactive Transactions

Predicate для каждого типа отличается, но исполнение — один `ExecutePayment`:

```
Recurring:   paymentsMade < maxPayments && blockTime >= nextPaymentTime
Streaming:   blockTime - lastStreamTime >= 1
Vesting:     blockTime > cliffTime && totalStreamed < totalVested && blockTime < endTime
RWA:         dividendRegistered && userHasShares && !alreadyPaidThisRound
Treasury:    streamApproved && budgetRemaining > 0
```

## Технический стек

| Компонент | Технология |
|---|---|
| **Blockchain** | Rialo (SVM, RISC-V, 50ms блоки) |
| **Gas** | Stake-for-Service (ServicePaymaster) |
| **Автоматизация** | Reactive Transactions |
| **Безопасность** | Threshold Cryptography / DKG (v2) |
| **Фронтенд** | React + @rialo/frost |
| **Деплой frontend** | Railway + Docker + Caddy |
| **On-chain** | Rust + rialo-s-program |
| **Токены** | USDC / RWA-токены (Rialo Interop) |

## Дорожная карта

### MVP (сейчас)
- [x] Rust-программа: create/cancel/execute
- [x] Reactive Transaction predicate для recurring
- [x] TypeScript SDK (черновик)
- [x] React UI — формы Vesting / Stream / Subscription + Dashboard
- [x] Frontend задеплоен на Railway (demo mode)
- [ ] Деплой программы на Rialo devnet + регистрация Reactive Transaction
- [ ] Реальные on-chain вызовы вместо demo

### Phase 2 (RWA + DAO)
- [ ] StreamType: Subscription, Streaming, Vesting, RwaDividend
- [ ] Интерфейс "One-click treasury stream"
- [ ] Vesting schedule для DAO-токенов
- [ ] RWA dividend distribution

### Phase 3 (DeFi composability)
- [ ] DKG для кросс-чейн выплат
- [ ] Multisig treasury через Threshold Cryptography
- [ ] Compliance для RWA (Rialo Compliance Primitive)
- [ ] Интеграция с Rialo Stream (native data feeds)

## Deploy

### Frontend (уже работает)

Live: **https://subpay-mvp-production.up.railway.app/**

```bash
# Локально
cd frontend
npm ci
npm run dev
```

### On-chain программа

```bash
cd programs/subpay-core
cargo build-bpf --arch riscv64
rialo program deploy target/deploy/subpay-core.so \
  --url https://devnet.rialo.io \
  --keypair ~/subpay-keypair.json
```

## Ссылки

- **Live Demo:** https://subpay-mvp-production.up.railway.app/
- [Rialo Learn](https://learn.rialo.io/)
- [Reactive Transactions](https://learn.rialo.io/tutorials/reactive/)
- [Stake for Service](https://rialo.io/posts/stake-for-service)
- [DKG](https://rialo.io/posts/understanding-distributed-key-generation)
- [GitHub](https://github.com/Splendor1980/subpay-mvp)
