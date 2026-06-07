# BTC Portfolio Dashboard

Next.js dashboard for a simple BTC/USDC allocation rule.

## Strategy

```text
Base: 0% BTC, 100% USDC
If BTC drawdown from cycle high >= 15%: target 25% BTC
If BTC drawdown from cycle high >= 40%: target 75% BTC
If BTC rebound from cycle low >= 20% and close >= daily_slow_ma: target 100% BTC
No futures. No leverage. No short.
```

The dashboard computes the target BTC allocation, aggregates balances, and shows how much BTC to buy or sell to reach the target.

## Config

Non-secret settings live in [config/dashboard.json](/Users/patrick/Developer/mev-mono/btc-portfolio-dashboard/config/dashboard.json).
Use [config/dashboard.public.example.json](/Users/patrick/Developer/mev-mono/btc-portfolio-dashboard/config/dashboard.public.example.json) as the public fill-in template.

```json
{
  "tradingPair": "BTCUSDC",
  "strategy": {
    "cycleLookbackDays": 365,
    "slowMaDays": 200,
    "rebalanceThresholdPct": 2
  },
  "btcWalletAddresses": [],
  "manualBalances": []
}
```

## Vercel Environment Variables

```text
BINANCE_API_KEY=
BINANCE_API_SECRET=

OKX_API_KEY=
OKX_API_SECRET=
OKX_API_PASSPHRASE=
```

Only server-side code reads exchange secrets. The browser receives only computed balances and the rebalance plan.

## Local Run

```bash
npm install
npm run dev
```

## Safety

This app does not place orders. It only displays the target allocation and the buy/sell amount required to rebalance.
