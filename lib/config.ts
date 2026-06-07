import fs from "fs";
import path from "path";
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

type DashboardConfig = typeof dashboardConfig;

function localConfig(): Partial<DashboardConfig> {
  const file = path.join(process.cwd(), "config/dashboard.local.json");
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8")) as Partial<DashboardConfig>;
}

export function loadConfig(): AppConfig {
  const local = localConfig();
  return {
    tradingPair: local.tradingPair || dashboardConfig.tradingPair,
    cycleLookbackDays: local.strategy?.cycleLookbackDays || dashboardConfig.strategy.cycleLookbackDays,
    slowMaDays: local.strategy?.slowMaDays || dashboardConfig.strategy.slowMaDays,
    rebalanceThresholdFraction: (local.strategy?.rebalanceThresholdPct || dashboardConfig.strategy.rebalanceThresholdPct) / 100,
    binanceBaseUrl: local.exchanges?.binance?.baseUrl || dashboardConfig.exchanges.binance.baseUrl,
    binanceMarketDataBaseUrl:
      local.exchanges?.binance?.marketDataBaseUrl || dashboardConfig.exchanges.binance.marketDataBaseUrl,
    okxBaseUrl: local.exchanges?.okx?.baseUrl || dashboardConfig.exchanges.okx.baseUrl,
    okxProjectId: local.exchanges?.okx?.projectId || dashboardConfig.exchanges.okx.projectId,
    btcWalletAddresses: local.btcWalletAddresses || dashboardConfig.btcWalletAddresses,
    manualBalances: local.manualBalances || dashboardConfig.manualBalances,
  };
}
