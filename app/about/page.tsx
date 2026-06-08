import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "策略说明 — BTC Portfolio Dashboard",
  description: "BTC/USDC 策略分配规则的完整说明",
};

export default function AboutPage() {
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
            <h1>策略说明</h1>
            <p>BTC GATE · 基于周期回撤与反弹确认的简单配置规则</p>
          </div>
        </div>
        <nav className="nav">
          <Link href="/" className="navLink">返回仪表盘</Link>
        </nav>
      </header>

      <section className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div className="heroCard" style={{ minHeight: "auto" }}>
          <span className="label">核心思想</span>
          <strong style={{ fontSize: "clamp(20px, 2.4vw, 28px)" }}>
            周期高点回撤时逐步加仓 BTC，反弹确认后满仓持有。
          </strong>
          <small>
            不使用杠杆、不做空、不碰合约。只在现货 BTC 与稳定币之间进行再平衡。
          </small>
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <article className="panel">
          <h2>四条配置规则（按优先级判断）</h2>
          <div className="ruleList">
            <RuleCard
              priority={1}
              title="反弹确认 — 目标 100% BTC"
              condition="从周期低点反弹 ≥ 20%，且当前收盘价 ≥ 慢速日均线"
              detail="当市场从周期底部显著反弹，并且价格重新站上长期均线时，视为趋势恢复信号，全部配置到 BTC。"
              color="green"
            />
            <RuleCard
              priority={2}
              title="深度回撤 — 目标 75% BTC"
              condition="从周期高点回撤 ≥ 40%"
              detail="市场经历大幅回调后，将大部分资产配置到 BTC，保留少量稳定币作为缓冲。"
              color="purple"
            />
            <RuleCard
              priority={3}
              title="轻度回撤 — 目标 25% BTC"
              condition="从周期高点回撤 ≥ 15%"
              detail="市场出现明显回调但尚未深跌，小仓位配置 BTC，大部分仍持有稳定币。"
              color="cyan"
            />
            <RuleCard
              priority={4}
              title="基础状态 — 目标 0% BTC（100% 稳定币）"
              condition="未满足以上任何条件"
              detail="市场处于高位或震荡期，不持有 BTC，全部以 USDC/USDT 形式持有。"
              color="muted"
            />
          </div>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>策略参数</h2>
          <div className="metricList">
            <Metric name="交易对" value="BTCUSDC" note="Binance 现货交易对，价格数据来源。" />
            <Metric name="周期回看天数" value="365 天" note="用于计算周期高点与周期低点的日线回看窗口。" />
            <Metric name="慢速日均线" value="200 日 SMA" note="最近 200 根日线收盘价的简单移动平均线，作为反弹确认的长期趋势过滤器。" />
            <Metric name="再平衡阈值" value="2%" note="目标配置与实际配置的差额小于组合净值 2% 时，不触发交易建议。" />
            <Metric name="数据源" value="Binance Vision" note="https://data-api.binance.vision，免费公开的历史 K 线接口。" />
          </div>
        </article>

        <article className="panel">
          <h2>计算口径</h2>
          <div className="metricList">
            <Metric
              name="周期回撤率"
              value="(周期最高收盘价 − 当前收盘价) ÷ 周期最高收盘价 × 100%"
              note="周期高点取自回看窗口内的最大收盘价。"
            />
            <Metric
              name="周期反弹率"
              value="(当前收盘价 − 周期最低收盘价) ÷ 周期最低收盘价 × 100%"
              note="周期低点取自回看窗口内的最小收盘价。"
            />
            <Metric
              name="BTC 当前价值"
              value="BTC 总量 × 当前 BTC/USDC 收盘价"
              note="所有来源的 BTC 汇总后按最新收盘价估值。"
            />
            <Metric
              name="组合总净值"
              value="BTC 当前价值 + 稳定币总量"
              note="稳定币 = USDC + USDT，来自三组手动输入的合计。"
            />
            <Metric
              name="当前 BTC 比例"
              value="BTC 当前价值 ÷ 组合总净值"
              note="与目标 BTC 比例比较后得出再平衡建议。"
            />
          </div>
        </article>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <article className="panel">
          <h2>安全声明</h2>
          <div className="safetyList">
            <p>• 本应用<strong>不连接任何交易所 API</strong>，不会自动下单或读取账户余额。</p>
            <p>• 资产余额由用户<strong>手动输入</strong>，数据仅保存在当前浏览器的 localStorage 中。</p>
            <p>• 本应用<strong>不提供投资建议</strong>，仅按预设规则进行数学计算并展示结果。</p>
            <p>• 不使用期货、杠杆、做空或其他衍生品工具。</p>
            <p>• 再平衡操作需用户自行在交易所手动执行。</p>
          </div>
        </article>
      </section>

      <footer className="footer">
        <Link href="/" className="navLink">← 返回仪表盘</Link>
      </footer>
    </main>
  );
}

function RuleCard({
  priority,
  title,
  condition,
  detail,
  color,
}: {
  priority: number;
  title: string;
  condition: string;
  detail: string;
  color: "green" | "purple" | "cyan" | "muted";
}) {
  const colorMap = {
    green: "var(--green)",
    purple: "var(--purple)",
    cyan: "var(--cyan)",
    muted: "var(--muted)",
  };
  return (
    <div className="ruleCard">
      <div className="rulePriority" style={{ color: colorMap[color] }}>
        规则 {priority}
      </div>
      <h3 style={{ color: colorMap[color] }}>{title}</h3>
      <p className="ruleCondition">
        <strong>触发条件：</strong>{condition}
      </p>
      <p className="ruleDetail">{detail}</p>
    </div>
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
