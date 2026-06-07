export type BalanceSource = {
  source: string;
  btc: number;
  usdc: number;
  ok: boolean;
  error?: string;
};

export type MarketSnapshot = {
  symbol: string;
  price: number;
  close: number;
  dailySlowMa: number;
  cycleHigh: number;
  cycleLow: number;
  cycleDrawdownPct: number;
  cycleReboundPct: number;
};

export type StrategyDecision = {
  targetBtcFraction: number;
  matchedRule: string;
};

export type PortfolioSnapshot = {
  btc: number;
  usdc: number;
  totalUsdc: number;
  btcValueUsdc: number;
  currentBtcFraction: number;
};

export type RebalancePlan = {
  action: "BUY_BTC" | "SELL_BTC" | "HOLD";
  deltaBtc: number;
  deltaUsdc: number;
  thresholdUsdc: number;
};

export type DashboardSnapshot = {
  generatedAt: string;
  market: MarketSnapshot;
  strategy: StrategyDecision;
  portfolio: PortfolioSnapshot;
  rebalance: RebalancePlan;
  balances: BalanceSource[];
  warnings: string[];
};
