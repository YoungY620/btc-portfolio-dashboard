import { buildDashboardSnapshot } from "../lib/snapshot";

export const dynamic = "force-dynamic";

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

export default async function Page() {
  const snapshot = await buildDashboardSnapshot();
  const deltaAbsUsdc = Math.abs(snapshot.rebalance.deltaUsdc);
  const deltaAbsBtc = Math.abs(snapshot.rebalance.deltaBtc);

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
        <div className={`action ${snapshot.rebalance.action.toLowerCase()}`}>
          {actionText(snapshot.rebalance.action)}
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
          <strong>{pct(snapshot.portfolio.currentBtcFraction)}</strong>
          <small>BTC 市值 / 组合总净值</small>
        </div>
        <div className={`heroCard command ${snapshot.rebalance.action.toLowerCase()}`}>
          <span className="label">需要执行</span>
          <strong>{deltaAbsBtc.toFixed(6)} BTC</strong>
          <small>{actionText(snapshot.rebalance.action)} · {usd(deltaAbsUsdc)}</small>
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
            <Metric name="组合总净值" value={usd(snapshot.portfolio.totalUsdc)} note="BTC 价值 + 稳定币总量。" />
            <Metric name="BTC 总量" value={num(snapshot.portfolio.btc, 8)} note="Binance、OKX 和 BTC 钱包余额合计。" />
            <Metric name="BTC 当前价值" value={usd(snapshot.portfolio.btcValueUsdc)} note="BTC 总量 × 当前 BTC/USDC 价格。" />
            <Metric name="稳定币总量" value={usd(snapshot.portfolio.usdc)} note="USDC + USDT 合计；其他稳定币暂不计入。" />
            <Metric name="忽略小额调整" value={usd(snapshot.rebalance.thresholdUsdc)} note="目标差额小于组合净值 2% 时不交易。" />
          </div>
        </article>
      </section>

      <section className="panel">
        <h2>余额来源</h2>
        <div className="table">
          <div className="row head"><span>来源</span><span>BTC 数量</span><span>稳定币 USDC+USDT</span><span>状态</span></div>
          {snapshot.balances.map((item) => (
            <div className="row" key={item.source}>
              <span>{item.source}</span>
              <span>{num(item.btc, 8)}</span>
              <span>{usd(item.usdc)}</span>
              <span className={item.ok ? "ok" : "warn"}>{item.ok ? "OK" : item.error}</span>
            </div>
          ))}
        </div>
      </section>

      {snapshot.warnings.length > 0 && (
        <section className="warnings">
          {snapshot.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </section>
      )}
    </main>
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
