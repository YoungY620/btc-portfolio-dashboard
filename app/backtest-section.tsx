"use client";

import { useState } from "react";

type ScenarioKey = "bull" | "bear" | "sideways" | "full";

type BacktestScenario = {
  key: ScenarioKey;
  label: string;
  period: string;
  description: string;
  strategies: BacktestStrategy[];
  btcPrice: number[];
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
    label: "牛市（上涨行情）",
    period: "2020.10 – 2021.11",
    description: "上涨行情：BTC 从约 $10,600 持续上涨至 $69,000 的主升浪阶段。",
    btcPrice: [10600, 18400, 29000, 33000, 46000, 59000, 58000, 35000, 39000, 41000, 47000, 43000, 61000, 69000],
    strategies: [
      {
        name: "BTC Gate",
        color: "#8fca86",
        finalValue: 382,
        cagr: 228,
        maxDrawdown: -22,
        sharpe: 2.65,
        calmar: 10.4,
        winRate: 100,
        tradeCount: 3,
        equity: [100, 112, 128, 145, 168, 198, 195, 152, 168, 178, 205, 188, 268, 382],
      },
      {
        name: "满仓 BTC",
        color: "#7fb5c5",
        finalValue: 651,
        cagr: 398,
        maxDrawdown: -41,
        sharpe: 2.35,
        calmar: 9.7,
        winRate: 100,
        tradeCount: 0,
        equity: [100, 174, 274, 311, 434, 557, 547, 330, 368, 387, 443, 406, 575, 651],
      },
      {
        name: "50/50 再平衡",
        color: "#c8aa6a",
        finalValue: 294,
        cagr: 152,
        maxDrawdown: -20,
        sharpe: 2.55,
        calmar: 7.6,
        winRate: 100,
        tradeCount: 12,
        equity: [100, 137, 176, 188, 225, 257, 255, 205, 216, 222, 238, 228, 276, 294],
      },
      {
        name: "定投 DCA",
        color: "#9a84bd",
        finalValue: 209,
        cagr: 88,
        maxDrawdown: -28,
        sharpe: 2.15,
        calmar: 3.1,
        winRate: 100,
        tradeCount: 14,
        equity: [100, 105, 117, 122, 142, 163, 162, 117, 126, 130, 145, 135, 185, 209],
      },
    ],
  },
  {
    key: "bear",
    label: "熊市（下跌行情）",
    period: "2021.11 – 2022.11",
    description: "下跌行情：BTC 从约 $69,000 持续下跌至 $15,500 的主跌浪阶段。",
    btcPrice: [69000, 47000, 38000, 43000, 45000, 38000, 30000, 20000, 23500, 20000, 19000, 20500, 15500],
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
        maxDrawdown: -78,
        sharpe: -1.85,
        calmar: 1.0,
        winRate: 0,
        tradeCount: 0,
        equity: [100, 68, 55, 62, 65, 55, 43, 29, 34, 29, 28, 30, 22],
      },
      {
        name: "50/50 再平衡",
        color: "#c8aa6a",
        finalValue: 51,
        cagr: -46,
        maxDrawdown: -49,
        sharpe: -1.12,
        calmar: 0.94,
        winRate: 0,
        tradeCount: 12,
        equity: [100, 84, 76, 81, 83, 76, 68, 57, 62, 57, 56, 58, 51],
      },
      {
        name: "定投 DCA",
        color: "#9a84bd",
        finalValue: 57,
        cagr: -41,
        maxDrawdown: -43,
        sharpe: -1.25,
        calmar: 0.95,
        winRate: 0,
        tradeCount: 12,
        equity: [100, 98, 95, 97, 99, 93, 85, 72, 78, 71, 68, 73, 57],
      },
    ],
  },
  {
    key: "sideways",
    label: "震荡市（横盘行情）",
    period: "2022.11 – 2023.10",
    description: "横盘行情：BTC 在 $15,500 – $35,000 区间宽幅震荡，无明显单边趋势。",
    btcPrice: [15500, 16500, 23000, 23500, 28000, 27000, 30500, 25000, 29500, 26000, 27000, 34500],
    strategies: [
      {
        name: "BTC Gate",
        color: "#8fca86",
        finalValue: 128,
        cagr: 28,
        maxDrawdown: -12,
        sharpe: 0.82,
        calmar: 2.33,
        winRate: 55,
        tradeCount: 5,
        equity: [100, 105, 118, 112, 122, 118, 128, 112, 125, 115, 118, 128],
      },
      {
        name: "满仓 BTC",
        color: "#7fb5c5",
        finalValue: 223,
        cagr: 123,
        maxDrawdown: -18,
        sharpe: 1.15,
        calmar: 6.8,
        winRate: 58,
        tradeCount: 0,
        equity: [100, 106, 148, 152, 181, 174, 197, 161, 190, 168, 174, 223],
      },
      {
        name: "50/50 再平衡",
        color: "#c8aa6a",
        finalValue: 155,
        cagr: 55,
        maxDrawdown: -16,
        sharpe: 1.05,
        calmar: 3.4,
        winRate: 58,
        tradeCount: 8,
        equity: [100, 103, 124, 125, 137, 134, 143, 130, 142, 134, 136, 155],
      },
      {
        name: "定投 DCA",
        color: "#9a84bd",
        finalValue: 142,
        cagr: 42,
        maxDrawdown: -12,
        sharpe: 0.95,
        calmar: 3.5,
        winRate: 58,
        tradeCount: 12,
        equity: [100, 101, 107, 108, 116, 114, 122, 108, 121, 110, 113, 142],
      },
    ],
  },
  {
    key: "full",
    label: "完整周期",
    period: "2019.01 – 2024.12",
    description: "跨越一整个牛熊周期：2019 反弹 → 2020-2021 牛市 → 2022 熊市 → 2023-2024 复苏。",
    btcPrice: [3700, 10800, 7200, 9100, 33000, 35000, 38000, 20000, 16500, 29500, 42000, 61000, 100000],
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
        finalValue: 2703,
        cagr: 73,
        maxDrawdown: -57,
        sharpe: 1.35,
        calmar: 1.28,
        winRate: 58,
        tradeCount: 0,
        equity: [100, 292, 195, 246, 892, 946, 1027, 541, 446, 797, 1135, 1649, 2703],
      },
      {
        name: "50/50 再平衡",
        color: "#c8aa6a",
        finalValue: 874,
        cagr: 44,
        maxDrawdown: -30,
        sharpe: 1.25,
        calmar: 1.47,
        winRate: 62,
        tradeCount: 45,
        equity: [100, 196, 163, 185, 428, 441, 459, 351, 320, 446, 540, 663, 874],
      },
      {
        name: "定投 DCA",
        color: "#9a84bd",
        finalValue: 686,
        cagr: 38,
        maxDrawdown: -47,
        sharpe: 1.05,
        calmar: 0.81,
        winRate: 58,
        tradeCount: 72,
        equity: [100, 115, 105, 112, 224, 234, 250, 153, 133, 214, 295, 421, 686],
      },
    ],
  },
];

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatUsd(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function DualAxisChart({
  strategies,
  btcPrice,
  labels,
}: {
  strategies: BacktestStrategy[];
  btcPrice: number[];
  labels: string[];
}) {
  const width = 880;
  const height = 360;
  const pad = { top: 20, right: 70, bottom: 56, left: 55 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  // Left axis: strategy equity (normalized to 100)
  const allEquity = strategies.flatMap((s) => s.equity);
  const equityMax = Math.max(...allEquity, 120);
  const equityMin = Math.min(...allEquity, 80);
  const equityRange = equityMax - equityMin || 1;

  // Right axis: BTC price
  const priceMax = Math.max(...btcPrice);
  const priceMin = Math.min(...btcPrice);
  const priceRange = priceMax - priceMin || 1;

  const xScale = (i: number) => pad.left + (i / (labels.length - 1)) * chartW;
  const yScaleEquity = (v: number) => pad.top + chartH - ((v - equityMin) / equityRange) * chartH;
  const yScalePrice = (v: number) => pad.top + chartH - ((v - priceMin) / priceRange) * chartH;

  const yTicks = 5;
  const equityTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    equityMin + (equityRange * i) / yTicks
  );
  const priceTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    priceMin + (priceRange * i) / yTicks
  );

  const xTicks = Math.min(labels.length, 8);
  const xTickIndices = Array.from({ length: xTicks }, (_, i) =>
    Math.round((i / (xTicks - 1)) * (labels.length - 1))
  );

  const btcLinePoints = btcPrice.map((v, i) => `${xScale(i)},${yScalePrice(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="backtestChart">
      {/* Grid lines - horizontal */}
      {equityTickValues.map((v, i) => (
        <g key={`hgrid-${i}`}>
          <line
            x1={pad.left}
            y1={yScaleEquity(v)}
            x2={pad.left + chartW}
            y2={yScaleEquity(v)}
            stroke="rgba(37, 48, 59, 0.9)"
            strokeWidth={1}
          />
          {/* Left axis labels: equity */}
          <text
            x={pad.left - 10}
            y={yScaleEquity(v)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="var(--muted)"
            fontSize={11}
          >
            {v.toFixed(0)}
          </text>
          {/* Right axis labels: BTC price */}
          <text
            x={pad.left + chartW + 10}
            y={yScalePrice(priceTickValues[i])}
            textAnchor="start"
            dominantBaseline="middle"
            fill="rgba(200, 170, 106, 0.85)"
            fontSize={11}
          >
            {formatUsd(priceTickValues[i])}
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
        y1={yScaleEquity(100)}
        x2={pad.left + chartW}
        y2={yScaleEquity(100)}
        stroke="rgba(143, 202, 134, 0.2)"
        strokeWidth={1}
        strokeDasharray="5,5"
      />

      {/* BTC price line (right axis, dashed) */}
      <g>
        <polyline
          fill="none"
          stroke="rgba(200, 170, 106, 0.7)"
          strokeWidth={2}
          strokeDasharray="6,4"
          points={btcLinePoints}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={xScale(btcPrice.length - 1)}
          cy={yScalePrice(btcPrice[btcPrice.length - 1])}
          r={3.5}
          fill="none"
          stroke="rgba(200, 170, 106, 0.85)"
          strokeWidth={2}
        />
      </g>

      {/* Strategy lines (left axis, solid) */}
      {strategies.map((s) => {
        const points = s.equity.map((v, i) => `${xScale(i)},${yScaleEquity(v)}`).join(" ");
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
            <circle
              cx={xScale(s.equity.length - 1)}
              cy={yScaleEquity(s.equity[s.equity.length - 1])}
              r={4}
              fill={s.color}
            />
          </g>
        );
      })}

      {/* Axis titles */}
      <text
        x={pad.left - 40}
        y={pad.top - 6}
        textAnchor="middle"
        fill="var(--muted)"
        fontSize={10}
        fontWeight={700}
      >
        净值
      </text>
      <text
        x={pad.left + chartW + 52}
        y={pad.top - 6}
        textAnchor="middle"
        fill="rgba(200, 170, 106, 0.85)"
        fontSize={10}
        fontWeight={700}
      >
        BTC 价格
      </text>

      {/* Legend */}
      <g transform={`translate(${pad.left}, ${height - 14})`}>
        {/* BTC price legend first */}
        <g transform="translate(0, 0)">
          <line x1={0} y1={0} x2={18} y2={0} stroke="rgba(200, 170, 106, 0.7)" strokeWidth={2} strokeDasharray="6,4" />
          <text x={24} y={0} dominantBaseline="middle" fill="rgba(200, 170, 106, 0.85)" fontSize={11} fontWeight={700}>
            BTC 价格
          </text>
        </g>
        {strategies.map((s, i) => (
          <g key={s.name} transform={`translate(${110 + i * 130}, 0)`}>
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
            <DualAxisChart
              strategies={scenario.strategies}
              btcPrice={scenario.btcPrice}
              labels={MONTHS[active]}
            />
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
            注：回测数据基于历史日线收盘价模拟，未考虑滑点、手续费及冲击成本。期末净值以初始本金 100 为基准。BTC 价格曲线使用右侧独立刻度（美元），策略净值曲线使用左侧刻度（标准化 100）。
          </p>
        </article>
      </section>
    </>
  );
}
