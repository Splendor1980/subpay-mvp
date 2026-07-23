# Deploying SubPay to Railway

## Быстрый старт

1. Зайди на [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Выбери этот репозиторий
3. Railway подхватит `railway.json` и `nixpacks.toml` автоматически

## Переменные окружения

В Railway Dashboard → твой сервис → **Variables** добавь:

| Переменная | Значение |
|---|---|
| `NODE_ENV` | `production` |
| `BASE_PATH` | `/` |

`PORT` Railway выставляет сам — ничего делать не нужно.

## Что происходит при деплое

```
pnpm install --frozen-lockfile
  └─ устанавливает весь монорепо

pnpm --filter @workspace/subpay run build
  └─ vite build → артефакты в artifacts/subpay/dist/public/

pnpm --filter @workspace/subpay run serve
  └─ vite preview отдаёт статику на порту Railway
```

## Кастомный домен

Railway Dashboard → твой сервис → **Settings → Domains** → Generate Domain  
(или привяжи свой домен)

## Обновления

Каждый `git push` в подключённую ветку → Railway автоматически пересобирает и деплоит.
