import { fetchBinanceDailyCloses } from "./binance";
import { loadConfig } from "./config";
import { aggregatePortfolio, buildRebalancePlan } from "./portfolio";
import { buildMarketSnapshot, decideStrategy } from "./strategy";
import type { DashboardSnapshot } from "./types";

export async function buildDashboardSnapshot(): Promise<DashboardSnapshot> {
  const config = loadConfig();
  const limit = Math.max(config.slowMaDays, config.cycleLookbackDays) + 5;
  const closes = await fetchBinanceDailyCloses(config.marketDataBaseUrl, config.tradingPair, limit);
  const market = buildMarketSnapshot(config.tradingPair, closes, config.slowMaDays, config.cycleLookbackDays);
  const strategy = decideStrategy(market);
  const portfolio = aggregatePortfolio([], market.price);
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
    balances: [],
    warnings: [],
  };
}
