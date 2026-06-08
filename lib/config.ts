import fs from "fs";
import path from "path";
import dashboardConfig from "../config/dashboard.json";

export type AppConfig = {
  tradingPair: string;
  cycleLookbackDays: number;
  slowMaDays: number;
  rebalanceThresholdFraction: number;
  marketDataBaseUrl: string;
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
    marketDataBaseUrl: local.marketDataBaseUrl || dashboardConfig.marketDataBaseUrl,
  };
}
