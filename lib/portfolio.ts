import type { BalanceSource, PortfolioSnapshot, RebalancePlan } from "./types";

export function aggregatePortfolio(balances: BalanceSource[], btcPriceUsdc: number): PortfolioSnapshot {
  const btc = balances.reduce((sum, item) => sum + item.btc, 0);
  const usdc = balances.reduce((sum, item) => sum + item.usdc, 0);
  const btcValueUsdc = btc * btcPriceUsdc;
  const totalUsdc = btcValueUsdc + usdc;

  return {
    btc,
    usdc,
    totalUsdc,
    btcValueUsdc,
    currentBtcFraction: totalUsdc > 0 ? btcValueUsdc / totalUsdc : 0,
  };
}

export function buildRebalancePlan(
  portfolio: PortfolioSnapshot,
  targetBtcFraction: number,
  btcPriceUsdc: number,
  rebalanceThresholdFraction: number,
): RebalancePlan {
  const targetBtcValueUsdc = portfolio.totalUsdc * targetBtcFraction;
  const deltaUsdc = targetBtcValueUsdc - portfolio.btcValueUsdc;
  const thresholdUsdc = portfolio.totalUsdc * rebalanceThresholdFraction;

  if (portfolio.totalUsdc <= 0 || Math.abs(deltaUsdc) <= thresholdUsdc) {
    return { action: "HOLD", deltaBtc: 0, deltaUsdc: 0, thresholdUsdc };
  }

  return {
    action: deltaUsdc > 0 ? "BUY_BTC" : "SELL_BTC",
    deltaBtc: btcPriceUsdc > 0 ? deltaUsdc / btcPriceUsdc : 0,
    deltaUsdc,
    thresholdUsdc,
  };
}
