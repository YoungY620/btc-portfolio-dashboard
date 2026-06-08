"use client";

import { useEffect, useMemo, useState } from "react";
import { aggregatePortfolio, buildRebalancePlan } from "../lib/portfolio";
import type { BalanceSource, DashboardSnapshot, RebalancePlan } from "../lib/types";

const MANUAL_BALANCE_KEY_PREFIX = "btc_gate.manual_asset_balance.v1.";

type ManualSource = "binance" | "okx" | "eth_wallet";

type ManualAccountBalance = {
  btc: number;
  usdc: number;
  usdt: number;
  updatedAt: string;
};

const MANUAL_SOURCES: Array<{ id: ManualSource; title: string; note: string }> = [
  {
    id: "binance",
    title: "Binance 手动输入",
    note: "手动填写 Binance 里的 BTC、USDC、USDT，用于计算总资产。",
  },
  {
    id: "okx",
    title: "OKX 手动输入",
    note: "手动填写 OKX 里的 BTC、USDC、USDT，用于计算总资产。",
  },
  {
    id: "eth_wallet",
    title: "ETH 钱包手动输入",
    note: "手动填写链上 ETH 钱包里的 BTC 封装资产、USDC、USDT，用于计算总资产。",
  },
];

function emptyManualBalance(): ManualAccountBalance {
  return { btc: 0, usdc: 0, usdt: 0, updatedAt: "" };
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function usd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function num(value: number, digits = 6): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function actionText(action: string): string {
  if (action === "BUY_BTC") return "买入 BTC";
  if (action === "SELL_BTC") return "卖出 BTC";
  return "不操作";
}

function ruleText(rule: string): string {
  if (rule === "REBOUND_CONFIRMATION") return "反弹确认，目标满仓 BTC";
  if (rule === "DEEP_DRAWDOWN") return "深度回撤，目标 75% BTC";
  if (rule === "LIGHT_DRAWDOWN") return "轻度回撤，目标 25% BTC";
  return "基础状态，持有稳定币";
}

function ruleConditionText(rule: string): string {
  if (rule === "REBOUND_CONFIRMATION") return "从周期低点反弹 >= 20%，且当前收盘价 >= 慢速日均线";
  if (rule === "DEEP_DRAWDOWN") return "从周期高点回撤 >= 40%";
  if (rule === "LIGHT_DRAWDOWN") return "从周期高点回撤 >= 15%";
  return "未满足反弹确认、深度回撤、轻度回撤条件";
}

function safeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function storageKey(source: ManualSource): string {
  return `${MANUAL_BALANCE_KEY_PREFIX}${source}`;
}

function loadManualBalance(source: ManualSource): ManualAccountBalance {
  if (typeof window === "undefined") return emptyManualBalance();
  const raw = window.localStorage.getItem(storageKey(source));
  if (!raw) return emptyManualBalance();
  try {
    const parsed = JSON.parse(raw) as Partial<ManualAccountBalance>;
    return {
      btc: safeNumber(parsed.btc),
      usdc: safeNumber(parsed.usdc),
      usdt: safeNumber(parsed.usdt),
      updatedAt: parsed.updatedAt || "",
    };
  } catch {
    return emptyManualBalance();
  }
}

function saveManualBalance(source: ManualSource, balance: ManualAccountBalance): void {
  window.localStorage.setItem(storageKey(source), JSON.stringify(balance));
}

function balanceSource(source: ManualSource, balance: ManualAccountBalance): BalanceSource {
  return {
    source,
    btc: balance.btc,
    usdc: balance.usdc + balance.usdt,
    ok: true,
  };
}

function applyRebalance(balance: ManualAccountBalance, rebalance: RebalancePlan): ManualAccountBalance {
  if (rebalance.action === "HOLD") return { ...balance, updatedAt: new Date().toISOString() };

  const btc = Math.max(0, balance.btc + rebalance.deltaBtc);
  let usdc = balance.usdc;
  let usdt = balance.usdt;

  if (rebalance.deltaUsdc > 0) {
    const spendUsdc = Math.min(usdc, rebalance.deltaUsdc);
    const remainingSpend = rebalance.deltaUsdc - spendUsdc;
    usdc -= spendUsdc;
    usdt = Math.max(0, usdt - remainingSpend);
  } else {
    usdc += Math.abs(rebalance.deltaUsdc);
  }

  return { btc, usdc, usdt, updatedAt: new Date().toISOString() };
}

function useDashboard(snapshot: DashboardSnapshot) {
  const [manualBalances, setManualBalances] = useState<Record<ManualSource, ManualAccountBalance>>({
    binance: emptyManualBalance(),
    okx: emptyManualBalance(),
    eth_wallet: emptyManualBalance(),
  });

  useEffect(() => {
    setManualBalances({
      binance: loadManualBalance("binance"),
      okx: loadManualBalance("okx"),
      eth_wallet: loadManualBalance("eth_wallet"),
    });
  }, []);

  const balances = useMemo(
    () => MANUAL_SOURCES.map((source) => balanceSource(source.id, manualBalances[source.id])),
    [manualBalances],
  );
  const portfolio = aggregatePortfolio(balances, snapshot.market.price);
  const rebalance = buildRebalancePlan(portfolio, snapshot.strategy.targetBtcFraction, snapshot.market.price, 0.02);

  function updateManual(source: ManualSource, next: Partial<ManualAccountBalance>): void {
    setManualBalances((current) => {
      const updated = { ...current[source], ...next, updatedAt: new Date().toISOString() };
      saveManualBalance(source, updated);
      return { ...current, [source]: updated };
    });
  }

  function markRebalanced(source: ManualSource): void {
    setManualBalances((current) => {
      const updated = applyRebalance(current[source], rebalance);
      saveManualBalance(source, updated);
      return { ...current, [source]: updated };
    });
  }

  return {
    balances,
    portfolio,
    rebalance,
    manualBalances,
    updateManual,
    markRebalanced,
  };
}

export function DashboardClient({ snapshot }: { snapshot: DashboardSnapshot }) {
  const dashboard = useDashboard(snapshot);
  const deltaAbsUsdc = Math.abs(dashboard.rebalance.deltaUsdc);
  const deltaAbsBtc = Math.abs(dashboard.rebalance.deltaBtc);

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <div className="mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <h1>BTC GATE</h1>
            <p>{snapshot.market.symbol} · {new Date(snapshot.generatedAt).toLocaleString("zh-CN")}</p>
          </div>
        </div>
        <div className={`action ${dashboard.rebalance.action.toLowerCase()}`}>
          {actionText(dashboard.rebalance.action)}
        </div>
      </header>

      <section className="hero">
        <div className="heroCard target">
          <span className="label">目标 BTC 比例</span>
          <strong>{pct(snapshot.strategy.targetBtcFraction)}</strong>
          <small>{ruleText(snapshot.strategy.matchedRule)}</small>
        </div>
        <div className="heroCard current">
          <span className="label">现在 BTC 比例</span>
          <strong>{pct(dashboard.portfolio.currentBtcFraction)}</strong>
          <small>三组手动资产合计</small>
        </div>
        <div className={`heroCard command ${dashboard.rebalance.action.toLowerCase()}`}>
          <span className="label">需要执行</span>
          <strong>{deltaAbsBtc.toFixed(6)} BTC</strong>
          <small>{actionText(dashboard.rebalance.action)} · {usd(deltaAbsUsdc)}</small>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>策略信号</h2>
          <div className="metricList">
            <Metric name="触发规则" value={ruleText(snapshot.strategy.matchedRule)} note="按照回撤、反弹和慢速日均线依次判断。" />
            <Metric name="进入条件" value={ruleConditionText(snapshot.strategy.matchedRule)} note="当前状态对应的确定性判断表达式。" />
            <Metric name="从周期高点回撤" value={`${snapshot.market.cycleDrawdownPct.toFixed(2)}%`} note="(周期最高收盘价 - 当前收盘价) / 周期最高收盘价。" />
            <Metric name="从周期低点反弹" value={`${snapshot.market.cycleReboundPct.toFixed(2)}%`} note="(当前收盘价 - 周期最低收盘价) / 周期最低收盘价。" />
            <Metric name="当前收盘价" value={usd(snapshot.market.close)} note="Binance 日线最新收盘价。" />
            <Metric name="慢速日均线" value={usd(snapshot.market.dailySlowMa)} note="最近 200 根日线收盘价的简单平均值。" />
          </div>
        </article>

        <article className="panel">
          <h2>组合口径</h2>
          <div className="metricList">
            <Metric name="组合总净值" value={usd(dashboard.portfolio.totalUsdc)} note="BTC 价值 + 稳定币总量。" />
            <Metric name="BTC 总量" value={num(dashboard.portfolio.btc, 8)} note="Binance、OKX、ETH 钱包三组手动输入合计。" />
            <Metric name="BTC 当前价值" value={usd(dashboard.portfolio.btcValueUsdc)} note="BTC 总量 × 当前 BTC/USDC 价格。" />
            <Metric name="稳定币总量" value={usd(dashboard.portfolio.usdc)} note="USDC + USDT 合计。" />
            <Metric name="忽略小额调整" value={usd(dashboard.rebalance.thresholdUsdc)} note="目标差额小于组合净值 2% 时不交易。" />
          </div>
        </article>
      </section>

      <section className="manualSources">
        {MANUAL_SOURCES.map((source) => (
          <ManualSourcePanel
            key={source.id}
            title={source.title}
            note={source.note}
            balance={dashboard.manualBalances[source.id]}
            rebalance={dashboard.rebalance}
            onChange={(next) => dashboard.updateManual(source.id, next)}
            onMarkRebalanced={() => dashboard.markRebalanced(source.id)}
          />
        ))}
      </section>

      <section className="panel">
        <h2>余额来源</h2>
        <div className="table">
          <div className="row head"><span>来源</span><span>BTC 数量</span><span>稳定币 USDC+USDT</span><span>状态</span></div>
          {dashboard.balances.map((item) => (
            <div className="row" key={item.source}>
              <span>{item.source}</span>
              <span>{num(item.btc, 8)}</span>
              <span>{usd(item.usdc)}</span>
              <span className={item.ok ? "ok" : "warn"}>{item.ok ? "OK" : item.error}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ManualSourcePanel({
  title,
  note,
  balance,
  rebalance,
  onChange,
  onMarkRebalanced,
}: {
  title: string;
  note: string;
  balance: ManualAccountBalance;
  rebalance: RebalancePlan;
  onChange: (next: Partial<ManualAccountBalance>) => void;
  onMarkRebalanced: () => void;
}) {
  return (
    <article className="panel manualPanel">
      <h2>{title}</h2>
      <p className="manualNote">{note} 数据只保存在当前浏览器 localStorage。</p>
      <div className="manualGrid">
        <ManualInput label="BTC" value={balance.btc} onChange={(btc) => onChange({ btc })} />
        <ManualInput label="USDC" value={balance.usdc} onChange={(usdc) => onChange({ usdc })} />
        <ManualInput label="USDT" value={balance.usdt} onChange={(usdt) => onChange({ usdt })} />
      </div>
      {balance.updatedAt && <small>最后更新：{new Date(balance.updatedAt).toLocaleString("zh-CN")}</small>}
      <button className="primaryButton" type="button" disabled={rebalance.action === "HOLD"} onClick={onMarkRebalanced}>
        已按本次建议操作，更新缓存
      </button>
    </article>
  );
}

function ManualInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="manualInput">
      <span>{label}</span>
      <input
        inputMode="decimal"
        type="number"
        min="0"
        step="any"
        value={value || ""}
        onChange={(event) => onChange(Number(event.currentTarget.value || 0))}
      />
    </label>
  );
}

function Metric({ name, value, note }: { name: string; value: string; note: string }) {
  return (
    <div className="metric">
      <div>
        <span>{name}</span>
        <small>{note}</small>
      </div>
      <b>{value}</b>
    </div>
  );
}
