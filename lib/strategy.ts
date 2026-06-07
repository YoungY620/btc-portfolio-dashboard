import type { MarketSnapshot, StrategyDecision } from "./types";

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildMarketSnapshot(
  symbol: string,
  closes: number[],
  slowMaDays: number,
  cycleLookbackDays: number,
): MarketSnapshot {
  const required = Math.max(slowMaDays, cycleLookbackDays);
  if (closes.length < required) {
    throw new Error(`Need at least ${required} daily closes`);
  }

  const close = closes[closes.length - 1];
  const slowWindow = closes.slice(-slowMaDays);
  const cycleWindow = closes.slice(-cycleLookbackDays);
  const dailySlowMa = average(slowWindow);
  const cycleHigh = Math.max(...cycleWindow);
  const cycleLow = Math.min(...cycleWindow);

  return {
    symbol,
    price: close,
    close,
    dailySlowMa,
    cycleHigh,
    cycleLow,
    cycleDrawdownPct: cycleHigh > 0 ? ((cycleHigh - close) / cycleHigh) * 100 : 0,
    cycleReboundPct: cycleLow > 0 ? ((close - cycleLow) / cycleLow) * 100 : 0,
  };
}

export function decideStrategy(market: MarketSnapshot): StrategyDecision {
  if (market.cycleReboundPct >= 20 && market.close >= market.dailySlowMa) {
    return {
      targetBtcFraction: 1,
      matchedRule: "REBOUND_CONFIRMATION",
    };
  }
  if (market.cycleDrawdownPct >= 40) {
    return { targetBtcFraction: 0.75, matchedRule: "DEEP_DRAWDOWN" };
  }
  if (market.cycleDrawdownPct >= 15) {
    return { targetBtcFraction: 0.25, matchedRule: "LIGHT_DRAWDOWN" };
  }
  return { targetBtcFraction: 0, matchedRule: "BASE_STABLE" };
}
