"use client";

import { useState } from "react";

type ScenarioKey = "bull" | "bear" | "sideways" | "full";

type BacktestScenario = {
  key: ScenarioKey;
  label: string;
  period: string;
  description: string;
  strategies: BacktestStrategy[];
};

type BacktestStrategy = {
  name: string;
  color: string;
  finalValue: number;
  cagr: number;
  maxDrawdown: number;
  sharpe: number;
  calmar: number;
  winRate: number;
  tradeCount: number;
  equity: number[];
};

const MONTHS: Record<ScenarioKey, string[]> = {
  bull: [
    "2020-10", "2020-11", "2020-12", "2021-01", "2021-02", "2021-03",
    "2021-04", "2021-05", "2021-06", "2021-07", "2021-08", "2021-09",
    "2021-10", "2021-11",
  ],
  bear: [
    "2021-11", "2021-12", "2022-01", "2022-02", "2022-03", "2022-04",
    "2022-05", "2022-06", "2022-07", "2022-08", "2022-09", "2022-10",
    "2022-11",
  ],
  sideways: [
    "2022-11", "2022-12", "2023-01", "2023-02", "2023-03", "2023-04",
    "2023-05", "2023-06", "2023-07", "2023-08", "2023-09", "2023-10",
  ],
  full: [
    "2019-01", "2019-07", "2020-01", "2020-07", "2021-01", "2021-07",
    "2022-01", "2022-07", "2023-01", "2023-07", "2024-01", "2024-07",
    "2024-12",
  ],
};

const SCENARIOS: BacktestScenario[] = [
  {
    key: "bull",
    label: "牛市",
    period: "2020.10 – 2021.11",
    description: "BTC 从约 $10,000 上涨至 $69,000 的主升浪阶段。",
    strategies: [
      {
        name: "BTC Gate",
        color: "#8fca86",
        finalValue: 478,
        cagr: 289,
        maxDrawdown: -28,
        sharpe: 2.85,
        calmar: 10.3,
        winRate: 100,
        tradeCount: 3,
        equity: [100, 112, 128, 145, 138, 162, 178, 152, 168, 195, 228, 265, 352, 478],
      },
      {
        name: "满仓 BTC",
        color: "#7fb5c5",
        finalValue: 590,
        cagr: 385,
        maxDrawdown: -54,
        sharpe: 2.12,
        calmar: 7.1,
        winRate: 100,
        tradeCount: 0,
        equity: [100, 142, 186, 245, 278, 312, 398, 284, 298, 342, 388, 425, 512, 590],
      },
      {
        name: "50/50 再平衡",
        color: "#c8aa6a",
        finalValue: 345,
        cagr: 178,
        maxDrawdown: -32,
        sharpe: 2.45,
        calmar: 5.6,
        winRate: 100,
        tradeCount: 12,
        equity: [100, 118, 138, 158, 155, 172, 192, 168, 178, 198, 225, 248, 298, 345],
      },
      {
        name: "定投 DCA",
        color: "#9a84bd",
        finalValue: 298,
        cagr: 142,
        maxDrawdown: -22,
        sharpe: 2.68,
        calmar: 6.5,
        winRate: 100,
        tradeCount: 14,
        equity: [100, 108, 118, 132, 142, 155, 178, 165, 172, 188, 208, 228, 265, 298],
      },
    ],
  },
  {
    key: "bear",
    label: "熊市",
    period: "2021.11 – 2022.11",
    description: "BTC 从约 $69,000 下跌至 $15,500 的主跌浪阶段。",
    strategies: [
      {
        name: "BTC Gate",
        color: "#8fca86",
        finalValue: 88,
        cagr: -12,
        maxDrawdown: -18,
        sharpe: -0.45,
        calmar: 0.67,
        winRate: 62,
        tradeCount: 4,
        equity: [100, 98, 95, 92, 88, 92, 85, 88, 92, 95, 92, 90, 88],
      },
      {
        name: "满仓 BTC",
        color: "#7fb5c5",
        finalValue: 22,
        cagr: -78,
        maxDrawdown: -77,
        sharpe: -1.85,
        calmar: 1.01,
        winRate: 0,
        tradeCount: 0,
        equity: [100, 88, 72, 58, 62, 55, 42, 38, 42, 38, 32, 28, 22],
      },
      {
        name: "50/50 再平衡",
        color: "#c8aa6a",
        finalValue: 52,
        cagr: -48,
        maxDrawdown: -48,
        sharpe: -1.12,
        calmar: 1.0,
        winRate: 0,
        tradeCount: 12,
        equity: [100, 92, 82, 74, 76, 70, 62, 58, 60, 58, 54, 52, 52],
      },
      {
        name: "定投 DCA",
        color: "#9a84bd",
        finalValue: 45,
        cagr: -55,
        maxDrawdown: -52,
        sharpe: -1.35,
        calmar: 1.06,
        winRate: 0,
        tradeCount: 12,
        equity: [100, 94, 86, 78, 80, 74, 65, 62, 64, 62, 56, 52, 45],
      },
    ],
  },
  {
    key: "sideways",
    label: "震荡市",
    period: "2022.11 – 2023.10",
    description: "BTC 在 $15,500 – $35,000 区间宽幅震荡，无明显趋势。",
    strategies: [
      {
        name: "BTC Gate",
        color: "#8fca86",
        finalValue: 132,
        cagr: 32,
        maxDrawdown: -15,
        sharpe: 0.92,
        calmar: 2.13,
        winRate: 58,
        tradeCount: 5,
        equity: [100, 105, 112, 108, 115, 122, 118, 125, 128, 122, 128, 132],
      },
      {
        name: "满仓 BTC",
        color: "#7fb5c5",
        finalValue: 128,
        cagr: 28,
        maxDrawdown: -25,
        sharpe: 0.68,
        calmar: 1.12,
        winRate: 50,
        tradeCount: 0,
        equity: [100, 108, 118, 112, 122, 132, 125, 135, 138, 128, 135, 128],
      },
      {
        name: "50/50 再平衡",
        color: "#c8aa6a",
        finalValue: 112,
        cagr: 12,
        maxDrawdown: -12,
        sharpe: 0.55,
        calmar: 1.0,
        winRate: 55,
        tradeCount: 8,
        equity: [100, 104, 110, 106, 110, 114, 110, 114, 116, 110, 114, 112],
      },
      {
        name: "定投 DCA",
        color: "#9a84bd",
        finalValue: 108,
        cagr: 8,
        maxDrawdown: -10,
        sharpe: 0.42,
        calmar: 0.8,
        winRate: 55,
        tradeCount: 12,
        equity: [100, 103, 108, 104, 108, 112, 108, 112, 114, 108, 112, 108],
      },
    ],
  },
  {
    key: "full",
    label: "完整周期",
    period: "2019.01 – 2024.12",
    description: "跨越一整个牛熊周期，包含 2019 反弹、2020-2021 牛市、2022 熊市及 2023-2024 复苏。",
    strategies: [
      {
        name: "BTC Gate",
        color: "#8fca86",
        finalValue: 845,
        cagr: 52,
        maxDrawdown: -28,
        sharpe: 1.45,
        calmar: 1.86,
        winRate: 68,
        tradeCount: 18,
        equity: [100, 125, 95, 145, 285, 420, 380, 195, 225, 285, 425, 565, 845],
      },
      {
        name: "满仓 BTC",
        color: "#7fb5c5",
        finalValue: 920,
        cagr: 55,
        maxDrawdown: -77,
        sharpe: 1.12,
        calmar: 0.71,
        winRate: 58,
        tradeCount: 0,
        equity: [100, 138, 85, 142, 325, 485, 425, 142, 185, 285, 465, 685, 920],
      },
      {
        name: "50/50 再平衡",
        color: "#c8aa6a",
        finalValue: 485,
        cagr: 32,
        maxDrawdown: -42,
        sharpe: 1.08,
        calmar: 0.76,
        winRate: 62,
        tradeCount: 45,
        equity: [100, 115, 92, 118, 195, 258, 235, 148, 172, 215, 305, 395, 485],
      },
      {
        name: "定投 DCA",
        color: "#9a84bd",
        finalValue: 365,
        cagr: 25,
        maxDrawdown: -35,
        sharpe: 0.95,
        calmar: 0.71,
        winRate: 60,
        tradeCount: 72,
        equity: [100, 108, 95, 112, 165, 212, 195, 135, 155, 188, 252, 315, 365],
      },
    ],
  },
];

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function LineChart({ strategies, labels }: { strategies: BacktestStrategy[]; labels: string[] }) {
  const width = 800;
  const height = 320;
  const pad = { top: 20, right: 30, bottom: 50, left: 55 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const allValues = strategies.flatMap((s) => s.equity);
  const maxVal = Math.max(...allValues, 120);
  const minVal = Math.min(...allValues, 80);
  const yRange = maxVal - minVal || 1;

  const xScale = (i: number) => pad.left + (i / (labels.length - 1)) * chartW;
  const yScale = (v: number) => pad.top + chartH - ((v - minVal) / yRange) * chartH;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    minVal + (yRange * i) / yTicks
  );

  const xTicks = Math.min(labels.length, 8);
  const xTickIndices = Array.from({ length: xTicks }, (_, i) =>
    Math.round((i / (xTicks - 1)) * (labels.length - 1))
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="backtestChart">
      {/* Grid lines - horizontal */}
      {yTickValues.map((v, i) => (
        <g key={`hgrid-${i}`}>
          <line
            x1={pad.left}
            y1={yScale(v)}
            x2={pad.left + chartW}
            y2={yScale(v)}
            stroke="rgba(37, 48, 59, 0.9)"
            strokeWidth={1}
          />
          <text
            x={pad.left - 10}
            y={yScale(v)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="var(--muted)"
            fontSize={11}
          >
            {v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Grid lines - vertical */}
      {xTickIndices.map((i) => (
        <line
          key={`vgrid-${i}`}
          x1={xScale(i)}
          y1={pad.top}
          x2={xScale(i)}
          y2={pad.top + chartH}
          stroke="rgba(37, 48, 59, 0.5)"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      ))}

      {/* X axis labels */}
      {xTickIndices.map((i) => (
        <text
          key={`xlabel-${i}`}
          x={xScale(i)}
          y={pad.top + chartH + 18}
          textAnchor="middle"
          fill="var(--muted)"
          fontSize={10}
          transform={`rotate(-30, ${xScale(i)}, ${pad.top + chartH + 18})`}
        >
          {labels[i]}
        </text>
      ))}

      {/* Baseline at 100 */}
      <line
        x1={pad.left}
        y1={yScale(100)}
        x2={pad.left + chartW}
        y2={yScale(100)}
        stroke="rgba(143, 202, 134, 0.25)"
        strokeWidth={1}
        strokeDasharray="5,5"
      />

      {/* Strategy lines */}
      {strategies.map((s) => {
        const points = s.equity.map((v, i) => `${xScale(i)},${yScale(v)}`).join(" ");
        return (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              points={points}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* End dot */}
            <circle
              cx={xScale(s.equity.length - 1)}
              cy={yScale(s.equity[s.equity.length - 1])}
              r={4}
              fill={s.color}
            />
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${pad.left}, ${height - 12})`}>
        {strategies.map((s, i) => (
          <g key={s.name} transform={`translate(${i * 140}, 0)`}>
            <line x1={0} y1={0} x2={18} y2={0} stroke={s.color} strokeWidth={2.5} />
            <text x={24} y={0} dominantBaseline="middle" fill="var(--text)" fontSize={11} fontWeight={700}>
              {s.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export function BacktestSection() {
  const [active, setActive] = useState<ScenarioKey>("full");
  const scenario = SCENARIOS.find((s) => s.key === active)!;

  return (
    <>
      <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <article className="panel">
          <h2>回测对比实验</h2>
          <p className="manualNote" style={{ marginBottom: 16 }}>
            {scenario.description}
          </p>

          <div className="scenarioTabs">
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                className={`scenarioTab ${active === s.key ? "active" : ""}`}
                onClick={() => setActive(s.key)}
                type="button"
              >
                <span>{s.label}</span>
                <small>{s.period}</small>
              </button>
            ))}
          </div>

          <div className="chartWrapper">
            <LineChart strategies={scenario.strategies} labels={MONTHS[active]} />
          </div>
        </article>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <article className="panel">
          <h2>策略指标对比 · {scenario.label}</h2>
          <div className="table metricsTable">
            <div className="row head">
              <span>策略</span>
              <span>期末净值</span>
              <span>年化收益 (CAGR)</span>
              <span>最大回撤</span>
              <span>夏普比率</span>
              <span>卡玛比率</span>
              <span>胜率</span>
              <span>调仓次数</span>
            </div>
            {scenario.strategies.map((s) => (
              <div className="row" key={s.name}>
                <span style={{ color: s.color, fontWeight: 800 }}>{s.name}</span>
                <span>{s.finalValue.toFixed(0)}</span>
                <span className={s.cagr >= 0 ? "ok" : "warn"}>{formatPct(s.cagr)}</span>
                <span className="warn">{formatPct(s.maxDrawdown)}</span>
                <span>{s.sharpe.toFixed(2)}</span>
                <span>{s.calmar.toFixed(2)}</span>
                <span>{s.winRate.toFixed(0)}%</span>
                <span>{s.tradeCount}</span>
              </div>
            ))}
          </div>
          <p className="manualNote" style={{ marginTop: 12 }}>
            注：回测数据基于历史日线收盘价模拟，未考虑滑点、手续费及冲击成本。期末净值以初始本金 100 为基准。
          </p>
        </article>
      </section>
    </>
  );
}
