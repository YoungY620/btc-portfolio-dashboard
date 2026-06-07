import dashboardConfig from "../config/dashboard.json";

type ManualBalance = {
  source: string;
  btc: number;
  usdc: number;
};

export type AppConfig = {
  tradingPair: string;
  cycleLookbackDays: number;
  slowMaDays: number;
  rebalanceThresholdFraction: number;
  binanceBaseUrl: string;
  binanceMarketDataBaseUrl: string;
  okxBaseUrl: string;
  okxProjectId: string;
  btcWalletAddresses: string[];
  manualBalances: ManualBalance[];
};

export function loadConfig(): AppConfig {
  return {
    tradingPair: dashboardConfig.tradingPair,
    cycleLookbackDays: dashboardConfig.strategy.cycleLookbackDays,
    slowMaDays: dashboardConfig.strategy.slowMaDays,
    rebalanceThresholdFraction: dashboardConfig.strategy.rebalanceThresholdPct / 100,
    binanceBaseUrl: dashboardConfig.exchanges.binance.baseUrl,
    binanceMarketDataBaseUrl: dashboardConfig.exchanges.binance.marketDataBaseUrl,
    okxBaseUrl: dashboardConfig.exchanges.okx.baseUrl,
    okxProjectId: dashboardConfig.exchanges.okx.projectId,
    btcWalletAddresses: dashboardConfig.btcWalletAddresses,
    manualBalances: dashboardConfig.manualBalances,
  };
}
