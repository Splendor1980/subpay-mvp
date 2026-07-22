# SubPay — Non-custodial Recurring Payments on Rialo

**SubPay** — платформа recurring payments на блокчейне Rialo.  
Деньги всегда остаются в кошельке пользователя. Платежи выполняются автоматически
через **Reactive Transactions** — без ботов, киперов и внешних сервисов.

## Архитектура

```
subpay-mvp/
├── programs/subpay-core/          ← Rust-программа (SVM, RISC-V)
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs                 ← entrypoint + dispatch
│       ├── instructions.rs        ← CreateSubscription, CancelSubscription, ExecutePayment
│       ├── state.rs               ← Subscription (PDA state)
│       └── errors.rs              ← Error codes
├── sdk/                           ← TypeScript SDK
│   ├── package.json
│   ├── tsconfig.json
│   └── src/index.ts               ← PDA derivation, instruction builders, batch helpers
├── frontend/                      ← React + @rialo/frost
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── config.ts              ← Rialo devnet config
│       ├── main.tsx               ← FrostProvider bootstrap
│       ├── App.tsx                ← Routing: landing / create / dashboard
│       └── components/
│           ├── CreateSubscription.tsx   ← Approve + Subscribe flow
│           └── SubscriptionList.tsx     ← Dashboard with cancel
└── README.md
```

## Поток работы (User Flow)

### 1. Создание подписки

| Шаг | Действие | Технически |
|---|---|---|
| **Approve** | Пользователь подписывает `Approve(delegate=PDA, amount=maxCap)` | SPL Token Approve |
| **Create** | Подписывает `CreateSubscription { merchant, amount, interval, maxPayments }` | Программа создаёт PDA |
| **Reactive** | Валидаторы проверяют predicate каждый блок | `is_due()` → `ExecutePayment` |

### 2. Автоматический платёж (Reactive Transaction)

```
Каждый блок:
  predicate = subscription.active
           && subscription.payments_made < subscription.maxPayments
           && block_time >= subscription.nextPaymentTime
  если true → ExecutePayment
              → CPI: Token::TransferChecked (delegate = PDA)
              → subscription.payments_made++
              → subscription.nextPaymentTime += interval
```

### 3. Отмена

`CancelSubscription` + `Token::Approve(PDA, 0)` в одной атомарной транзакции
(через `TransactionBuilder.addInstruction` дважды).

## Технические детали

### Gas (Stake-for-Service)

Rialo использует Stake-for-Service (SfS):
- Пользователь создаёт SfS-позицию, направляя % стейкинг-дохода в ServicePaymaster
- SPM mint'ит service credits → тратятся на газ reactive транзакций
- Отдельный баланс для газа **не требуется**

Подробно: [Stake for Service](https://rialo.io/posts/stake-for-service)

### Reactive Transactions

- **Predicate**: определяется при деплое — условие на on-chain данные
- **Action**: ExecutePayment — вызывается, когда predicate истинен
- **Execution**: детерминированная, внутри консенсуса, в конце блока
- **Ошибки**: логируются в `status.err`. Рекомендуется retry-паттерн на уровне predicate
  (проверять `allowance >= amount` прямо в predicate).

Подробно: [Reactive Transactions](https://learn.rialo.io/tutorials/reactive/)

### Безопасность (DKG / Threshold)

На MVP не требуется. Кросс-чейн выплаты и мультиподпись для экстренного останова —
в версии 2.0 с использованием DKG от Rialo.

## Deploy-инструкция

### 1. Rust-программа (subpay-core)

```bash
cd programs/subpay-core

# Собрать
cargo build-bpf --arch riscv64

# Деплой на Rialo devnet
rialo program deploy target/deploy/subpay-core.so \
  --url https://devnet.rialo.io \
  --keypair ~/subpay-keypair.json

# Сохранить Program ID — он понадобится для фронтенда
```

> **Note**: `cargo build-bpf` доступен в Rialo SDK.
> Установка: `cargo install rialo-cli`

### 2. Настроить SDK

```bash
cd sdk
npm install
npm run build
```

Обновите `SUBPAY_PROGRAM_ID` в `src/index.ts` после деплоя программы.

### 3. Запустить фронтенд

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 4. Reactive Transaction (один раз при старте)

После деплоя программы зарегистрируйте reactive транзакцию
через Rialo CLI или SDK:

```
# Predicate: subscription account data condition
# Action: ExecutePayment instruction
# Создаётся один раз — работает вечно
```

## Зависимости

| Компонент | Технология |
|---|---|
| **Blockchain** | Rialo (SVM, RISC-V) |
| **On-chain** | Rust + rialo-program + spl-token |
| **Фронтенд** | React 18 + @rialo/frost 0.12 |
| **SDK** | TypeScript + @rialo/ts-cdk 0.11 |
| **Токен** | USDC (Rialo Interop) / RLO для тестов |
| **Газ** | Stake-for-Service (ServicePaymaster) |

## Roadmap

### MVP (сейчас)
- [x] Rust-программа: create, cancel, execute
- [x] TypeScript SDK: PDA, инструкции, batch
- [x] React UI: Approve + Subscribe, Dashboard
- [ ] Аирдроп RLO на devnet для тестов
- [ ] Деплой программы
- [ ] Регистрация Reactive Transaction

### Version 2
- [ ] DKG для кросс-чейн выплат (через релеи)
- [ ] Экстренный останов (multisig через Threshold)
- [ ] Batch-выплаты мерчантам
- [ ] Telegram/Discord-нотификации

## Ссылки

- [Rialo Learn](https://learn.rialo.io/) — интерактивные туториалы
- [Reactive Transactions](https://learn.rialo.io/tutorials/reactive/)
- [DKG](https://learn.rialo.io/tutorials/dkg/)
- [Stake for Service](https://rialo.io/posts/stake-for-service)
- [Rialo Dev Portal](https://www.rialo.io/for-devs)
