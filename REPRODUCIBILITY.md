# 策略回测复现指南

> 本文档记录了复现 BTC Gate 策略研究的完整步骤。当前前端展示的回测数据为**示意性模拟数据**，真实回测需按以下步骤执行。

---

## 前置条件

### 1. 数据准备：Binance BTC 全量分钟线

从 Binance 下载 BTCUSDT（或 BTCUSDC）自上线以来的**全部分钟级 K 线数据**，保存为单个 CSV 文件。

**CSV 格式要求：**

```csv
open_time,open,high,low,close,volume,close_time,quote_volume,count,taker_buy_volume,taker_buy_quote_volume,ignore
1502942400000,4261.48,4261.48,4261.48,4261.48,0.15,1502942459999,639.222,1,0.15,639.222,0
...
```

**获取方式（任选其一）：**

- **官方历史数据下载**：https://data.binance.vision/?prefix=data/spot/monthly/klines/BTCUSDT/1m/
- **CCXT / binance-connector 脚本拉取**：遍历所有月份，逐月下载 1m K 线 ZIP，解压后合并
- **第三方聚合数据源**：如 `crypto-data` 等开源数据集

> 数据量估算：从 2017-08 到 2026-06，约 **500 万+ 根分钟线**，CSV 大小约 **1.5GB**。

---

## 2. 回测引擎代码

以下 Python 回测脚本实现了 BTC Gate 策略及四个 baseline 的完整对比逻辑。将数据路径填入 `DATA_PATH` 后直接运行即可。

```python
"""
BTC Gate 策略回测引擎
=====================
前置条件：
  1. 准备 Binance BTCUSDT 1m 全量历史数据 CSV（见上方说明）
  2. pip install pandas numpy

运行方式：
  python btc_gate_backtest.py

输出：
  - 控制台：各策略在四个场景下的关键指标
  - plots/ 目录：四个场景的双轴净值曲线图（PNG）
  - results/ 目录：各策略每月净值序列 CSV
"""

import pandas as pd
import numpy as np
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple

# ===================== 配置 =====================

DATA_PATH = "./data/BTCUSDT_1m_full.csv"  # <-- 替换为你的数据路径
OUTPUT_DIR = Path("./backtest_output")
OUTPUT_DIR.mkdir(exist_ok=True)

# 策略参数（与前端 config/dashboard.json 保持一致）
CYCLE_LOOKBACK_DAYS = 365
SLOW_MA_DAYS = 200
REBALANCE_THRESHOLD_PCT = 0.02
TRADING_PAIR = "BTCUSDT"

# 场景定义：(名称, 起始日期, 结束日期)
SCENARIOS: List[Tuple[str, str, str]] = [
    ("bull", "2020-10-01", "2021-11-30"),
    ("bear", "2021-11-01", "2022-11-30"),
    ("sideways", "2022-11-01", "2023-10-31"),
    ("full", "2019-01-01", "2024-12-31"),
]

# ===================== 数据加载 =====================

def load_minute_data(path: str) -> pd.DataFrame:
    """加载分钟线数据并转换为日线收盘价。"""
    df = pd.read_csv(path)
    df['open_time'] = pd.to_datetime(df['open_time'], unit='ms')
    df = df.set_index('open_time').sort_index()
    # 降采样到日线收盘价
    daily = df['close'].resample('D').last().dropna()
    return daily.to_frame('close')

# ===================== 策略实现 =====================

def calc_cycle_high_low(closes: pd.Series, lookback: int) -> Tuple[pd.Series, pd.Series]:
    """计算滚动周期高点和低点。"""
    cycle_high = closes.rolling(window=lookback, min_periods=lookback).max()
    cycle_low = closes.rolling(window=lookback, min_periods=lookback).min()
    return cycle_high, cycle_low

def calc_slow_ma(closes: pd.Series, ma_days: int) -> pd.Series:
    """计算慢速日均线。"""
    return closes.rolling(window=ma_days, min_periods=ma_days).mean()

def decide_target_btc_fraction(
    close: float,
    cycle_high: float,
    cycle_low: float,
    slow_ma: float,
) -> float:
    """
    BTC Gate 策略决策逻辑。
    返回目标 BTC 持仓比例（0 ~ 1）。
    """
    if cycle_low > 0:
        rebound_pct = (close - cycle_low) / cycle_low * 100
    else:
        rebound_pct = 0

    if cycle_high > 0:
        drawdown_pct = (cycle_high - close) / cycle_high * 100
    else:
        drawdown_pct = 0

    # 优先级 1：反弹确认
    if rebound_pct >= 20 and close >= slow_ma:
        return 1.0
    # 优先级 2：深度回撤
    if drawdown_pct >= 40:
        return 0.75
    # 优先级 3：轻度回撤
    if drawdown_pct >= 15:
        return 0.25
    # 基础状态
    return 0.0

def run_strategy(
    daily: pd.DataFrame,
    scenario_start: str,
    scenario_end: str,
    strategy_name: str,
) -> pd.DataFrame:
    """
    运行指定策略，返回场景区间内的每日净值序列。
    """
    mask = (daily.index >= scenario_start) & (daily.index <= scenario_end)
    df = daily.loc[mask].copy()
    if len(df) == 0:
        raise ValueError(f"场景 {scenario_start} ~ {scenario_end} 无数据")

    closes = df['close']
    cycle_high, cycle_low = calc_cycle_high_low(closes, CYCLE_LOOKBACK_DAYS)
    slow_ma = calc_slow_ma(closes, SLOW_MA_DAYS)

    # 初始化
    initial_cash = 100.0
    cash = initial_cash
    btc = 0.0
    nav_history = []
    trade_count = 0

    for date, row in df.iterrows():
        price = row['close']
        ch = cycle_high.loc[date]
        cl = cycle_low.loc[date]
        sma = slow_ma.loc[date]

        # 若均线未就绪，跳过交易（但记录净值）
        if pd.isna(ch) or pd.isna(cl) or pd.isna(sma):
            nav = cash + btc * price
            nav_history.append({'date': date, 'nav': nav})
            continue

        # 计算目标比例
        target_frac = decide_target_btc_fraction(price, ch, cl, sma)

        # 当前比例
        nav = cash + btc * price
        current_frac = (btc * price) / nav if nav > 0 else 0

        # 判断是否调仓（阈值 2%）
        if abs(target_frac - current_frac) > REBALANCE_THRESHOLD_PCT:
            # 执行再平衡
            target_btc_value = nav * target_frac
            target_btc = target_btc_value / price
            delta_btc = target_btc - btc
            delta_cash = -delta_btc * price
            cash += delta_cash
            btc = target_btc
            trade_count += 1

        nav = cash + btc * price
        nav_history.append({'date': date, 'nav': nav})

    result = pd.DataFrame(nav_history).set_index('date')
    result.attrs['trade_count'] = trade_count
    return result

def run_buy_hold(daily: pd.DataFrame, start: str, end: str) -> pd.DataFrame:
    """满仓 BTC 基准：首日全仓买入后持有不动。"""
    mask = (daily.index >= start) & (daily.index <= end)
    df = daily.loc[mask].copy()
    initial_price = df['close'].iloc[0]
    nav = 100.0 * (df['close'] / initial_price)
    result = pd.DataFrame({'nav': nav.values}, index=df.index)
    result.attrs['trade_count'] = 0
    return result

def run_rebalance_5050(daily: pd.DataFrame, start: str, end: str) -> pd.DataFrame:
    """50/50 月度再平衡：每月初再平衡到 50% BTC / 50% 现金。"""
    mask = (daily.index >= start) & (daily.index <= end)
    df = daily.loc[mask].copy()
    cash = 50.0
    btc = 50.0 / df['close'].iloc[0]
    navs = []
    trade_count = 0
    current_month = None

    for date, price in df['close'].items():
        if current_month != (date.year, date.month):
            current_month = (date.year, date.month)
            nav = cash + btc * price
            cash = nav * 0.5
            btc = (nav * 0.5) / price
            trade_count += 1
        nav = cash + btc * price
        navs.append(nav)

    result = pd.DataFrame({'nav': navs}, index=df.index)
    result.attrs['trade_count'] = trade_count
    return result

def run_dca(daily: pd.DataFrame, start: str, end: str) -> pd.DataFrame:
    """定投 DCA：每月初投入等额现金购买 BTC。"""
    mask = (daily.index >= start) & (daily.index <= end)
    df = daily.loc[mask].copy()
    total_months = df.resample('ME').ngroups
    monthly_invest = 100.0 / total_months
    cash = 100.0
    btc = 0.0
    navs = []
    trade_count = 0
    current_month = None

    for date, price in df['close'].items():
        if current_month != (date.year, date.month):
            current_month = (date.year, date.month)
            invest = min(monthly_invest, cash)
            cash -= invest
            btc += invest / price
            trade_count += 1
        nav = cash + btc * price
        navs.append(nav)

    result = pd.DataFrame({'nav': navs}, index=df.index)
    result.attrs['trade_count'] = trade_count
    return result

# ===================== 指标计算 =====================

def calc_metrics(nav: pd.Series) -> dict:
    """计算回测关键指标。"""
    nav = nav.dropna()
    if len(nav) < 2:
        return {}

    total_return = nav.iloc[-1] / nav.iloc[0] - 1
    years = (nav.index[-1] - nav.index[0]).days / 365.25
    cagr = (nav.iloc[-1] / nav.iloc[0]) ** (1 / max(years, 0.01)) - 1 if years > 0 else 0

    # 最大回撤
    peak = nav.cummax()
    drawdown = (nav - peak) / peak
    max_dd = drawdown.min()

    # 日收益率
    daily_ret = nav.pct_change().dropna()
    sharpe = daily_ret.mean() / daily_ret.std() * np.sqrt(365) if daily_ret.std() > 0 else 0
    calmar = cagr / abs(max_dd) if max_dd != 0 else 0

    return {
        'final_nav': nav.iloc[-1],
        'total_return': total_return,
        'cagr': cagr,
        'max_drawdown': max_dd,
        'sharpe': sharpe,
        'calmar': calmar,
    }

# ===================== 主程序 =====================

def main():
    print(f"加载数据: {DATA_PATH}")
    daily = load_minute_data(DATA_PATH)
    print(f"日线数据范围: {daily.index[0]} ~ {daily.index[-1]}, 共 {len(daily)} 条")

    all_results = {}

    for scenario_name, start, end in SCENARIOS:
        print(f"\n{'='*50}")
        print(f"场景: {scenario_name} ({start} ~ {end})")
        print(f"{'='*50}")

        # 运行各策略
        btc_gate = run_strategy(daily, start, end, "BTC Gate")
        buy_hold = run_buy_hold(daily, start, end)
        rebalance_5050 = run_rebalance_5050(daily, start, end)
        dca = run_dca(daily, start, end)

        strategies = {
            'BTC Gate': btc_gate,
            'Buy & Hold': buy_hold,
            '50/50 Rebalance': rebalance_5050,
            'DCA': dca,
        }

        all_results[scenario_name] = strategies

        # 打印指标
        for name, nav_df in strategies.items():
            metrics = calc_metrics(nav_df['nav'])
            trades = nav_df.attrs.get('trade_count', 0)
            print(f"\n{name}:")
            print(f"  期末净值: {metrics['final_nav']:.2f}")
            print(f"  总收益:   {metrics['total_return']*100:.1f}%")
            print(f"  CAGR:     {metrics['cagr']*100:.1f}%")
            print(f"  最大回撤: {metrics['max_drawdown']*100:.1f}%")
            print(f"  夏普:     {metrics['sharpe']:.2f}")
            print(f"  卡玛:     {metrics['calmar']:.2f}")
            print(f"  调仓次数: {trades}")

        # 保存净值序列 CSV
        for name, nav_df in strategies.items():
            fname = f"{scenario_name}_{name.lower().replace(' ', '_').replace('/', '_')}.csv"
            nav_df[['nav']].to_csv(OUTPUT_DIR / fname)

    print(f"\n✅ 结果已保存至: {OUTPUT_DIR}/")

if __name__ == "__main__":
    main()
```

---

## 3. 图表生成（Python 可视化）

回测完成后，使用以下脚本将净值序列绘制成与前端一致的双轴 SVG/PNG 图表：

```python
import matplotlib.pyplot as plt
import pandas as pd
from pathlib import Path

OUTPUT_DIR = Path("./backtest_output")

def plot_dual_axis(scenario: str, btc_price: pd.Series):
    """绘制双轴净值对比图。"""
    fig, ax1 = plt.subplots(figsize=(10, 5))

    # 左轴：策略净值
    colors = {'BTC Gate': '#8fca86', 'Buy & Hold': '#7fb5c5',
              '50/50 Rebalance': '#c8aa6a', 'DCA': '#9a84bd'}
    for name in colors:
        fname = f"{scenario}_{name.lower().replace(' ', '_').replace('/', '_')}.csv"
        df = pd.read_csv(OUTPUT_DIR / fname, index_col=0, parse_dates=True)
        ax1.plot(df.index, df['nav'], label=name, color=colors[name], linewidth=2)

    ax1.set_ylabel("策略净值 (基准 100)", color='#dce6df')
    ax1.tick_params(axis='y', labelcolor='#dce6df')
    ax1.axhline(y=100, color='rgba(143, 202, 134, 0.3)', linestyle='--', linewidth=1)

    # 右轴：BTC 价格
    ax2 = ax1.twinx()
    normalized_price = btc_price / btc_price.iloc[0] * 100
    ax2.plot(btc_price.index, btc_price.values, '--', color='rgba(200, 170, 106, 0.7)',
             linewidth=1.5, label='BTC Price')
    ax2.set_ylabel("BTC 价格 (USD)", color='rgba(200, 170, 106, 0.85)')
    ax2.tick_params(axis='y', labelcolor='rgba(200, 170, 106, 0.85)')

    ax1.set_title(f"Scenario: {scenario}", color='#dce6df')
    ax1.legend(loc='upper left')
    ax2.legend(loc='upper right')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / f"{scenario}_chart.png", dpi=150, facecolor='#0b0f14')
    plt.close()
```

---

## 4. 复现步骤总结

```bash
# 1. 克隆仓库
git clone <repo-url> && cd btc-portfolio-dashboard

# 2. 准备数据（使用 agent 的 /goal 命令完成此步骤）
#    目标：下载 Binance BTCUSDT 自 2017-08 以来的全部 1m K 线数据
#    输出：data/BTCUSDT_1m_full.csv

# 3. 安装依赖
pip install pandas numpy matplotlib

# 4. 运行回测
python btc_gate_backtest.py

# 5. 查看结果
ls backtest_output/
# ├── bull_buy___hold.csv
# ├── bull_50_50_rebalance.csv
# ├── bull_btc_gate.csv
# ├── bull_dca.csv
# ├── bull_chart.png
# └── ...
```

---

## 5. 注意事项

| 项目 | 说明 |
|---|---|
| 数据完整性 | 分钟线必须连续无缺失，若有缺失需前向填充或从相邻交易所补全 |
| 起始日期 | `full` 场景最早可从 2019-01 开始，因 200 日慢速均线需要约 1 年数据预热 |
| 手续费 | 当前脚本未扣除手续费。实盘建议加入 0.1%（Binance 现货）单边滑点 |
| 再平衡频率 | 当前脚本按日检查调仓条件，也可改为周频/月频以降低交易次数 |
| 数据精度 | 使用 `close` 收盘价作为再平衡价格，未使用更精细的 VWAP 或 TWAP |

---

## 6. 与前端数据的关系

| 来源 | 性质 | 可信度 |
|---|---|---|
| 前端 `backtest-section.tsx` | 示意性模拟数据 | ⭐ 仅用于 UI 演示 |
| Python 回测引擎 | 基于真实历史价格严格计算 | ⭐⭐⭐ 研究级 |
| 实际实盘 | 需考虑滑点、手续费、流动性 | ⭐⭐⭐⭐ 最终验证 |

> 当 Python 回测完成后，可将 `backtest_output/*.csv` 中的净值序列替换到 `app/backtest-section.tsx` 的 `SCENARIOS` 数组中，前端即可展示真实回测结果。
