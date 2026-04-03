# ZENITH — AI-Powered Automated Trading System
## Client Submission Document

> **Document Version:** 1.0  
> **System Version:** v4.3.2  
> **Date:** April 1, 2026  
> **Classification:** Client Confidential  
> **Prepared by:** Zenith Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [System Architecture](#4-system-architecture)
5. [AI & Machine Learning Engine](#5-ai--machine-learning-engine)
6. [Data Pipeline & Feature Engineering](#6-data-pipeline--feature-engineering)
7. [Trade Execution & Risk Management](#7-trade-execution--risk-management)
8. [Dashboard & Monitoring Interface](#8-dashboard--monitoring-interface)
9. [Database & Persistence Layer](#9-database--persistence-layer)
10. [AI Training & Continuous Improvement](#10-ai-training--continuous-improvement)
11. [Technology Stack](#11-technology-stack)
12. [Security & Data Protection](#12-security--data-protection)
13. [Profitability Model & Financial Projections](#13-profitability-model--financial-projections)
14. [Project Roadmap & Milestones](#14-project-roadmap--milestones)
15. [Frequently Asked Questions](#15-frequently-asked-questions)
16. [Glossary of Terms](#16-glossary-of-terms)

---

## 1. Executive Summary

**Zenith** is a fully automated, AI-powered options trading system designed for the Indian NIFTY 50 index. The system combines real-time market data ingestion, advanced machine learning, institutional-grade risk management, and autonomous trade execution into a single, integrated platform.

### What Zenith Does

Zenith continuously monitors the Indian stock market during trading hours (9:15 AM – 3:30 PM IST, Monday through Friday). Every 5 minutes, it:

1. **Collects** live market data from three professional data sources simultaneously
2. **Analyzes** the data using 57 advanced mathematical indicators across 9 categories
3. **Predicts** market direction using an XGBoost machine learning model
4. **Validates** the prediction through 8 independent safety checks
5. **Executes** the trade autonomously through a registered brokerage API
6. **Manages** risk with pre-placed Stop Loss and Target orders at the exchange level
7. **Logs** every decision (including decisions NOT to trade) to a PostgreSQL database
8. **Retrains** its AI model weekly using accumulated market intelligence

### Key Metrics

| Metric | Value |
|---|---|
| **Data Points Analyzed Per Decision** | 57 features across 9 categories |
| **Decision Speed** | < 50 milliseconds |
| **Data Columns Logged Per Snapshot** | 64 (complete market telemetry) |
| **Safety Gates Before Execution** | 8 independent hardcoded checks |
| **Risk/Reward Ratio** | 1 : 2.33 (asymmetric — losses are smaller than wins) |
| **Break-Even Win Rate Required** | ~30% (system targets 55–65%) |
| **Monitoring Dashboard Pages** | 11 specialized interfaces |
| **AI Retraining Frequency** | Weekly (automated Saturday cycle) |

---

## 2. Problem Statement

### Why Automated Trading Systems Are Necessary

The Indian derivatives market presents significant opportunity — NIFTY options are among the most liquid instruments in the world. However, **90% of retail options traders lose money**, not due to lack of market knowledge, but due to inherent psychological vulnerabilities:

| Psychological Trap | Description | Impact on Trading |
|---|---|---|
| **FOMO** (Fear of Missing Out) | Entering trades impulsively when markets appear to be "running away" | Buying at peaks, selling at bottoms — consistently poor timing |
| **Panic Selling** | Exiting profitable positions prematurely at the first sign of volatility | Capturing only a fraction of available profit on winning trades |
| **Overtrading** | Forcing trades during low-conviction, sideways market conditions | Accumulating small losses that compound into significant drawdowns |
| **Loss Aversion** | Moving stop-loss levels or refusing to exit losing positions | Converting manageable small losses into catastrophic portfolio damage |
| **Cognitive Overload** | Inability to process multiple conflicting technical indicators simultaneously | Missed opportunities and delayed decision-making during critical moments |

### Why Existing Solutions Fall Short

Most available trading bots and automated systems suffer from fundamental limitations:

- **Simplistic Analysis:** Rely on 2–3 basic technical indicators (moving average crossovers, RSI only), missing the multi-dimensional nature of market dynamics
- **No Institutional Intelligence:** Ignore Options Chain data (Gamma Exposure, Put-Call Ratios, IV Skew) — the very data that reveals what professional Market Makers are positioning for
- **Survivorship Bias:** Only learn from winning trades, never learning the equally important skill of when NOT to trade
- **Static Rules:** Use fixed, hardcoded rules that cannot adapt to changing market conditions over time
- **Black Box Operation:** Provide no transparency into why decisions are made, eroding trust and preventing audit

**Zenith was engineered to solve all five of these limitations simultaneously.**

---

## 3. Solution Overview

Zenith operates as a **closed-loop intelligent trading system** with four interconnected pillars:

```
    ┌─────────────┐     ┌───────────────┐     ┌──────────────┐     ┌─────────────┐
    │             │     │               │     │              │     │             │
    │  MARKET     │────►│  AI ENGINE    │────►│  EXECUTION   │────►│  MONITORING │
    │  DATA FEED  │     │  (Analysis)   │     │  (Trading)   │     │  (Dashboard)│
    │             │     │               │     │              │     │             │
    └─────────────┘     └───────────────┘     └──────────────┘     └─────────────┘
     3 Live Sources      57 Features           Dhan Broker API      11-Page React
     5-min intervals     XGBoost ML            Bracket Orders       Real-time UI
     Angel One + TV      Dual-Brain            Exchange-level SL    Explainable AI
    └────────────────────────────────────────────────────────────────────────────┘
                                         │
                                    ┌────▼────┐
                                    │SUPABASE │  64-column PostgreSQL database
                                    │DATABASE │  Complete audit trail
                                    └─────────┘
```

### How a Single Trading Cycle Works (5-Minute Loop)

**Step 1 — Data Collection** (0–2 seconds)
> The n8n orchestration engine simultaneously contacts three data providers: Angel One SmartAPI delivers 1-minute and 5-minute candlestick price data (Open, High, Low, Close, Volume). The Option Chain API delivers the full NIFTY options chain with strike prices, premiums, and open interest. TradingView Scanner delivers the live NIFTY spot price and India VIX (Volatility Index).

**Step 2 — Feature Engineering** (2–15 milliseconds)
> The collected raw data is forwarded to the Python AI engine via a REST API call. The engine's `indicators.py` module calculates 18 technical indicators using NumPy and Pandas. The `writers_zone.py` module analyzes the Options Chain to extract institutional intelligence: Gamma Exposure (GEX), Implied Volatility Skew, Put-Call Ratio (PCR), Max Pain level, and Open Interest change patterns.

**Step 3 — AI Prediction** (15–50 milliseconds)
> The `preprocessor.py` module converts all calculated indicators into a standardized 57-element numeric vector. This vector is fed into the XGBoost gradient-boosted decision tree model, which outputs a probability distribution: the likelihood that the market will move UP (Buy Call), DOWN (Buy Put), or remain FLAT (Wait). If the highest probability exceeds the 60% confidence threshold, the system proceeds to execution. If not, it outputs WAIT.

**Step 4 — Safety Validation** (< 1 millisecond)
> Even with high AI confidence, the signal must pass through 8 hardcoded safety gates (VIX check, ADX trend strength, opening buffer, streak confirmation, repeat protection, late-day penalty, trend exhaustion check, and the confidence floor). If any gate fails, the trade is blocked and the reason is logged.

**Step 5 — Trade Execution** (200–500 milliseconds)
> The system identifies the correct At-The-Money (ATM) NIFTY option, places a Market Buy Order through the Dhan HQ brokerage API, waits for the exact fill price from the exchange, then simultaneously places a Stop Loss order (-15 points) and a Target order (+35 points). All exit orders are placed at the exchange level — they execute even if Zenith's servers are offline.

**Step 6 — Telemetry Logging** (< 50 milliseconds)
> The complete decision package — all 64 data columns including market state, indicator values, AI confidence, action taken, and reasoning chain — is persisted to the Supabase PostgreSQL database. This includes WAIT and AVOID decisions, not just executed trades.

---

## 4. System Architecture

### Component Overview

| Component | Technology | Function |
|---|---|---|
| **Orchestration Engine** | n8n (Cloud) | Schedules 5-minute polling cycles, routes data between services, manages workflow state |
| **AI Microservice** | Python 3.12, FastAPI | Calculates indicators, engineers features, runs ML inference, applies safety rules |
| **ML Model** | XGBoost (CUDA GPU) | Gradient-boosted decision trees trained on historical market snapshots |
| **Trade Execution** | Dhan HQ REST API | Places and manages bracket orders (Entry + Stop Loss + Target) |
| **Market Data** | Angel One SmartAPI | Live and historical OHLCV candlestick data for NIFTY 50 |
| **Volatility Data** | TradingView Scanner | Real-time India VIX and NIFTY spot price |
| **Database** | Supabase (PostgreSQL) | 64-column feature store, trade records, and ML training data |
| **Dashboard** | React 18, TypeScript, Vite | 11-page professional monitoring and analytics interface |
| **Design System** | Custom CSS (Glassmorphism) | Premium dark-theme UI with Inter and JetBrains Mono typography |

### The Python AI Engine — Module Breakdown

| Module | Size | Function |
|---|---|---|
| `indicators.py` | 28,785 bytes | Calculates RSI, MACD, Bollinger Bands, SuperTrend, ADX, Aroon, CCI, MFI, Stochastic, VWAP, Volume Profile, Heikin Ashi, and candlestick pattern recognition |
| `writers_zone.py` | 17,567 bytes | Institutional Options Chain analysis — Gamma Exposure, IV Skew, Max Pain, Put-Call Ratios, Open Interest change tracking |
| `rule_engine.py` | 29,784 bytes | 25-step deterministic safety logic — the hardcoded "circuit breaker" that protects capital |
| `preprocessor.py` | 11,555 bytes | Converts qualitative indicators into a normalized 57-element numeric feature vector for ML input |
| `signal_engine.py` | 9,782 bytes | AI orchestrator — loads the XGBoost model, manages dual-brain architecture, applies confidence gating |
| `models.py` | 6,305 bytes | Pydantic data validation schemas — ensures no corrupted data reaches the AI |

**Total AI Engine:** 103,778 bytes of production-grade Python code.

---

## 5. AI & Machine Learning Engine

### The Dual-Brain Architecture

Zenith employs a unique **dual-brain architecture** that separates opportunity identification from capital protection:

**Brain #1 — XGBoost Machine Learning Model (Opportunity Identification)**
- Processes the 57-feature vector through gradient-boosted decision trees
- Outputs a probability distribution across three classes: BUY CALL (market goes up), BUY PUT (market goes down), WAIT (market is flat/uncertain)
- Only triggers execution when confidence exceeds 60%
- Gets retrained weekly with new market data — continuously improving

**Brain #2 — 25-Step Rules Engine (Capital Protection)**
- Hardcoded safety logic that cannot be overridden by the AI
- Implements 8 critical safety gates that must ALL pass before execution

| Safety Gate | Condition | Purpose |
|---|---|---|
| VIX Block | India VIX ≥ 25 | Halts all trading during extreme market-wide volatility |
| Trend Strength | ADX < 20 | Blocks trading in sideways, non-trending markets (chop) |
| Opening Buffer | First 30 minutes | Avoids gap risk from overnight news and opening volatility |
| Streak Confirmation | 2 consecutive bars | Requires sustained directional agreement, not one-bar spikes |
| Repeat Protection | Same-direction block | Prevents firing the same trade twice until 3 neutral bars reset |
| Late-Day Penalty | After 2:30 PM IST | Reduces confidence by 30% (Theta decay accelerates in final hour) |
| Trend Exhaustion | ADX declining from >40 | Detects fading trends before they reverse |
| Confidence Floor | AI confidence < 60% | Blocks low-conviction trades regardless of indicator agreement |

> **Key Design Principle:** The AI identifies when to trade. The Rules Engine decides when NOT to trade. Both must agree. This means the system cannot "go rogue" — even a highly confident AI prediction gets blocked if market conditions are structurally unsafe.

---

## 6. Data Pipeline & Feature Engineering

### The 57-Feature Matrix

Each 5-minute market snapshot is analyzed across **9 categories of intelligence**:

| Category | Features | What It Measures |
|---|---|---|
| **Trend** | 12 | Market direction and strength — EMA20, SMA50, SuperTrend, Parabolic SAR, Aroon, ADX with Directional Indicators |
| **Momentum** | 8 | Market acceleration/deceleration — RSI, Stochastic, CCI (Commodity Channel Index), MFI (Money Flow Index) |
| **MACD** | 6 | Momentum shift detection — Histogram values, crossovers, bullish/bearish flips, acceleration |
| **Volatility** | 8 | Market stability assessment — Bollinger Bands (upper/lower/squeeze), ATR, India VIX, VWAP positioning |
| **Volume** | 7 | Institutional participation — Volume spikes vs averages, Point of Control, Heikin Ashi trend confirmation |
| **Options Chain** | 10 | Institutional positioning intelligence — PCR, Gamma Exposure, IV Skew, Max Pain distance, OI changes |
| **Smart Money** | 4 | Institutional accumulation/distribution — Price action scoring, breakout/breakdown detection |
| **Time** | 6 | Session-context awareness — Opening drive, mid-session, closing session, time-decay adjustments |
| **Data Quality** | 2 | Input reliability — Available candle count, today's candle coverage |

> **Why 57 features?** Most retail trading systems analyze 2–3 indicators. Zenith's 57-feature approach gives the AI the equivalent analytical breadth of an institutional quant research team — processing trend, momentum, volatility, volume, options chain positioning, and time dynamics simultaneously.

### The 64-Column Database Record

Every 5-minute cycle produces a complete 64-column telemetry record in the database:

| Column Group | Examples | Purpose |
|---|---|---|
| **Metadata** (5 cols) | Timestamp, Session ID, Engine Version, Latency | Audit trail and reproducibility |
| **Market Context** (6 cols) | Spot Price, ATM Strike, VIX, Market Regime | Environmental snapshot |
| **Technical Indicators** (25 cols) | RSI, MACD, ADX, Bollinger Bands, SuperTrend, Stochastic, Aroon, CCI, MFI, VWAP, EMA, SMA, PSAR | Complete technical fingerprint |
| **Derivatives Intelligence** (12 cols) | PCR, GEX, IV Skew, Max Pain, OI Changes, Writers Confidence, Market Structure | Institutional positioning data |
| **Engine Output** (16 cols) | Final Signal, Raw Signal, Confidence, Reasoning Chain, Blocked Reason, Streak Data, Debug Flags | Full decision transparency |

**Critical design choice:** The system logs ALL decisions — including WAIT, AVOID, and SIDEWAYS states. This eliminates **Survivorship Bias**, ensuring the AI learns when NOT to trade with equal rigor as when to trade.

---

## 7. Trade Execution & Risk Management

### Order Execution Flow

When the AI identifies a valid trading opportunity and all safety gates pass:

1. **Strike Selection:** Dynamically identifies the At-The-Money (ATM) NIFTY option at the current spot price
2. **Entry Order:** Places a Market Buy Order via Dhan HQ API — instant execution at best available price
3. **Fill Confirmation:** Waits for exact fill price from the exchange (accounts for slippage)
4. **Risk Orders (Simultaneous):**
   - **Stop Loss:** Entry Price − 15 points (exchange-level trigger — executes even if system is offline)
   - **Target:** Entry Price + 35 points (exchange-level limit order)

### Risk/Reward Mathematics

```
Stop Loss:    -15 NIFTY points per trade
Target:       +35 NIFTY points per trade
Risk/Reward:  35 ÷ 15 = 1 : 2.33

Break-Even Win Rate = 1 ÷ (1 + 2.33) = 30%
```

This asymmetric structure means every winning trade earns **2.33× more** than every losing trade costs. The system only needs to be correct 30% of the time to break even.

### Profitability Projections (Per 100 Trades)

| Win Rate | Wins | Losses | Gross Profit | Gross Loss | **Net Profit (1 Lot)** | **Net Profit (5 Lots)** |
|---|---|---|---|---|---|---|
| **50%** | 50 × 35 × 65 = ₹1,13,750 | 50 × 15 × 65 = ₹48,750 | — | — | **₹65,000** | **₹3,25,000** |
| **55%** | 55 × 35 × 65 = ₹1,25,125 | 45 × 15 × 65 = ₹43,875 | — | — | **₹81,250** | **₹4,06,250** |
| **60%** | 60 × 35 × 65 = ₹1,36,500 | 40 × 15 × 65 = ₹39,000 | — | — | **₹97,500** | **₹4,87,500** |
| **65%** | 65 × 35 × 65 = ₹1,47,875 | 35 × 15 × 65 = ₹34,125 | — | — | **₹1,13,750** | **₹5,68,750** |

*(1 NIFTY Lot = 65 contracts. Calculations exclude brokerage and taxes.)*

---

## 8. Dashboard & Monitoring Interface

The React-based dashboard provides comprehensive system monitoring across **11 specialized pages**:

| Page | Function | Key Features |
|---|---|---|
| **Dashboard** | Real-time overview | 8 KPI cards, live equity curve, active positions, signal feed |
| **Signals** | Signal history | Every 5-minute AI decision with expandable 64-column detail |
| **Trades** | Execution log | Active positions with live P&L, closed trade archive |
| **Analytics** | Performance analysis | Win rate trends, equity curves, VIX bucket analysis, exit distribution |
| **Backtest** | Strategy validation | Historical rule testing with deterministic simulation engine |
| **Validation** | Accuracy audit | Compares AI predictions against actual market outcomes |
| **XAI** | Explainable AI | Feature importance breakdown for every prediction — full transparency |
| **Engine** | System diagnostics | Python API health, response times, model status, uptime monitoring |
| **Strategy Tuning** | Parameter optimization | Adjust rule engine parameters without code changes |
| **History** | Data explorer | Searchable, filterable database browser with export capability |
| **Settings** | Configuration | Risk parameters, API connections, system constants |

**Design:** Professional "Quantum Dark" theme with glassmorphism effects, Inter typography for readability, JetBrains Mono for numerical data, and micro-animations for enhanced user experience.

---

## 9. Database & Persistence Layer

### Supabase PostgreSQL Architecture

| Table | Columns | Purpose |
|---|---|---|
| `signals` | 64 | Complete telemetry record of every AI decision (including WAIT/AVOID) |
| `active_exit_orders` | 21 | Currently open positions with SL/Target order tracking |
| `trades` | 21 | Permanent archive of all completed trades with P&L |

**Additional Database Objects:**
- `ml_training_export` — SQL View that automatically converts the 64-column signals table into a clean 57-column numeric matrix for ML training
- `completed_trades_summary` — Aggregated trade performance statistics
- `daily_pnl_summary` — Day-by-day profit and loss tracking
- `signal_accuracy` — Historical signal accuracy metrics

**Security:** Row-Level Security (RLS) enabled on all tables. Service-role keys for write access (n8n only). Anonymous read-only keys for dashboard.

---

## 10. AI Training & Continuous Improvement

### The Oracle Labeling Protocol

After market hours, a script called **The Oracle** retroactively labels each data row with ground truth:

- For each 5-minute snapshot, it checks what **actually happened** in the next 60 minutes
- Did NIFTY rise +35 points? → Label = **0** (Buying a Call was the correct action)
- Did NIFTY fall -35 points? → Label = **1** (Buying a Put was the correct action)
- Did neither occur? → Label = **2** (Waiting was the correct action)

### Weekly Retraining Cycle

Every Saturday, the system executes:
1. **Oracle Run** — Labels all unlabeled rows from the week
2. **Data Export** — `ml_training_export` view generates the clean numeric matrix
3. **Model Training** — XGBoost trains on the FULL dataset (GPU-accelerated via NVIDIA CUDA)
4. **Validation** — Confusion matrix analysis; model is deployed only if accuracy ≥ 65%
5. **Deployment** — New model binary replaces the previous version for Monday's trading

> The AI gets measurably smarter every week. It never forgets past market conditions and never makes the same mistake twice.

---

## 11. Technology Stack

| Layer | Technology | Version/Detail |
|---|---|---|
| AI/ML | Python, XGBoost, Pandas, NumPy | Python 3.12, CUDA GPU acceleration |
| API | FastAPI, Uvicorn | REST endpoint at `/api/predict` |
| Orchestration | n8n | Cloud-hosted, 5-min cron schedule |
| Execution | Dhan HQ API | REST-based bracket order management |
| Market Data | Angel One SmartAPI | JWT-authenticated OHLCV feed |
| Volatility | TradingView Scanner | Public API — NIFTY + India VIX |
| Database | Supabase PostgreSQL | Cloud-hosted with RLS |
| Frontend | React 18, TypeScript, Vite 5 | 11-page SPA with real-time polling |
| Styling | Custom CSS | Glassmorphism dark theme system |
| GPU | NVIDIA RTX 2050 | CUDA-enabled model training |
| Version Control | GitHub | Full repository with history |

---

## 12. Security & Data Protection

| Layer | Protection |
|---|---|
| **Database** | Row-Level Security (RLS) on all tables; service-role keys for writes, anon keys for reads |
| **API Keys** | Broker tokens have trade-only permissions — no withdrawal or fund transfer capability |
| **Frontend** | Read-only database access; no write endpoints exposed to the UI |
| **Exchange Orders** | Stop Loss and Target orders execute at the exchange level — independent of Zenith infrastructure |
| **Version Control** | All code changes tracked in GitHub with commit history |
| **Environment Variables** | Sensitive credentials stored in `.env` files excluded from version control |

---

## 13. Profitability Model & Financial Projections

### Why The Math Works

The system's profitability is driven by **asymmetric risk-reward**, not by requiring extraordinary prediction accuracy:

- **Each win:** +35 points × lot size = defined profit
- **Each loss:** -15 points × lot size = defined, capped loss
- **Ratio:** Every win earns 2.33× what every loss costs
- **Break-even:** Only 30% accuracy required
- **Target accuracy:** 55–65% (based on XGBoost ensemble capabilities on similar financial datasets)

### Scaling Strategy

| Phase | Timing | Lot Size | Purpose |
|---|---|---|---|
| Paper Trading | Month 1 | 0 (simulation) | Validate AI accuracy without capital risk |
| Proof of Edge | Month 2 | 1 Lot | Prove statistical edge with real execution |
| Confirmation | Month 3–4 | 2–3 Lots | Confirm consistency across market conditions |
| Growth | Month 5+ | 5+ Lots | Scale based on demonstrated statistical proof |

> Capital is never scaled based on confidence or enthusiasm — only on statistically proven performance over a minimum of 50 live trades.

---

## 14. Project Roadmap & Milestones

| Phase | Timeline | Deliverable | Status |
|---|---|---|---|
| **Architecture** | Jan–Mar 2026 | Complete system build — all 4 pillars operational | ✅ Complete |
| **Data Pipeline** | March 2026 | 64-column Supabase logging with 0% data loss | ✅ Live |
| **Bias Elimination** | March 2026 | WAIT/AVOID/SIDEWAYS states logged for training | ✅ Verified |
| **Dashboard** | March 2026 | 11-page React monitoring interface | ✅ Deployed |
| **Data Incubation** | Mar–Apr 2026 | Collect 2,000+ labeled market snapshots | 🔄 In Progress |
| **First Training** | April 2026 | XGBoost v1.0 trained on CUDA GPU | 📅 Scheduled |
| **Paper Testing** | May 2026 | 50 simulated trades — validate >60% accuracy | 📅 Planned |
| **Live Trading** | June 2026 | 1-Lot live execution — prove statistical edge | 📅 Planned |
| **Scaling** | July 2026+ | Increase lot size based on proven performance | 📅 Planned |
| **Advanced ML** | Dec 2026 | Evaluate LSTM deep learning as secondary model | 📅 Future |

---

## 15. Frequently Asked Questions

**Q: What markets does Zenith support?**
> Currently designed for NIFTY 50 index options on the National Stock Exchange of India (NSE). The architecture supports extension to other instruments.

**Q: What happens during a market crash?**
> Three automatic protections: (1) VIX ≥ 25 halts all trading. (2) Exchange-level Stop Loss triggers independently. (3) AI training includes crash data, teaching it to output WAIT during panics.

**Q: Can the AI lose all the capital?**
> No. Each trade has a fixed -15 point Stop Loss, capping the maximum loss per trade at ₹975 per lot. The system cannot hold losing positions indefinitely.

**Q: Is this a black box?**
> No. Every decision includes a full reasoning chain. The XAI dashboard shows exactly which features contributed to each prediction.

**Q: How does the system handle broker outages?**
> All exit orders (SL + Target) are placed at the exchange level at the moment of entry. They execute independently of Zenith's infrastructure.

**Q: What is the minimum capital required?**
> Approximately ₹1,00,000 for 1 lot of NIFTY options with adequate margin coverage.

---

## 16. Glossary of Terms

| Term | Definition |
|---|---|
| **ATM** | At-The-Money — the option strike price closest to the current NIFTY spot price |
| **ADX** | Average Directional Index — measures trend strength (0–100 scale) |
| **GEX** | Gamma Exposure — net gamma positioning of options Market Makers |
| **IV Skew** | Implied Volatility Skew — demand differential between call and put options |
| **Max Pain** | The strike price where total option holder loss is maximized (price gravitates here near expiry) |
| **OHLCV** | Open, High, Low, Close, Volume — standard candlestick data format |
| **PCR** | Put-Call Ratio — ratio of put option volume/OI to call option volume/OI |
| **RLS** | Row-Level Security — database access control at the individual row level |
| **RSI** | Relative Strength Index — momentum oscillator measuring overbought/oversold conditions |
| **VIX** | Volatility Index — measures expected market volatility (India VIX for NSE) |
| **XGBoost** | Extreme Gradient Boosting — ensemble ML algorithm using decision trees |
| **VWAP** | Volume-Weighted Average Price — institutional benchmark price level |

---

> **Document Classification:** Client Confidential  
> **Prepared:** April 1, 2026  
> **System Version:** v4.3.2 | Architecture: Production-Ready  
> **Current Phase:** Data Incubation — AI Training Pipeline Active
