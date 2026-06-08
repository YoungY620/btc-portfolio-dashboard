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
Asset balances are entered manually in the browser. The dashboard has three manual sources:

- Binance: BTC, USDC, USDT.
- OKX: BTC, USDC, USDT.
- ETH wallet: BTC, USDC, USDT.

Each source is stored in browser localStorage and has a one-click rebalance cache update button.

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
  "marketDataBaseUrl": "https://data-api.binance.vision"
}
```

## Browser Storage

No Binance or OKX account API keys are used. Manual balances are stored only in the current browser's localStorage.

## Local Run

```bash
npm install
npm run dev
```

## Safety

This app does not place orders. It only displays the target allocation and the buy/sell amount required to rebalance.
