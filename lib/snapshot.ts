import { fetchBinanceBalances, fetchBinanceDailyCloses } from "./binance";
import { loadConfig } from "./config";
import { fetchOkxBalances } from "./okx";
import { aggregatePortfolio, buildRebalancePlan } from "./portfolio";
import { buildMarketSnapshot, decideStrategy } from "./strategy";
import type { BalanceSource, DashboardSnapshot } from "./types";
import { fetchBtcWalletBalance } from "./wallets";

function manualBalances(): BalanceSource[] {
  return loadConfig().manualBalances.map((item) => ({
    source: item.source,
    btc: item.btc,
    usdc: item.usdc,
    ok: true,
  }));
}

export async function buildDashboardSnapshot(): Promise<DashboardSnapshot> {
  const config = loadConfig();
  const limit = Math.max(config.slowMaDays, config.cycleLookbackDays) + 5;
  const closes = await fetchBinanceDailyCloses(config.binanceMarketDataBaseUrl, config.tradingPair, limit);
  const market = buildMarketSnapshot(config.tradingPair, closes, config.slowMaDays, config.cycleLookbackDays);
  const strategy = decideStrategy(market);

  const fetched = await Promise.allSettled([
    fetchBinanceBalances(config.binanceBaseUrl),
    fetchOkxBalances(config.okxBaseUrl, config.okxProjectId),
    ...config.btcWalletAddresses.map((address) => fetchBtcWalletBalance(address)),
  ]);

  const balances = fetched.map((result, index): BalanceSource => {
    if (result.status === "fulfilled") return result.value;
    return {
      source: `source_${index + 1}`,
      btc: 0,
      usdc: 0,
      ok: false,
      error: result.reason instanceof Error ? result.reason.message : "unknown error",
    };
  }).concat(manualBalances());

  const usableBalances = balances.filter((item) => item.ok);
  const portfolio = aggregatePortfolio(usableBalances, market.price);
  const rebalance = buildRebalancePlan(
    portfolio,
    strategy.targetBtcFraction,
    market.price,
    config.rebalanceThresholdFraction,
  );

  return {
    generatedAt: new Date().toISOString(),
    market,
    strategy,
    portfolio,
    rebalance,
    balances,
    warnings: balances.filter((item) => !item.ok).map((item) => `${item.source}: ${item.error || "not available"}`),
  };
}
