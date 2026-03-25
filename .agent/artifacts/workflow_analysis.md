# Zenith Quantum Terminal — Institutional Systems Analysis & Development Matrix

> **Aesthetic Profile:** Technical, analytical, and uncompromisingly precise.
> **Core Objective:** Establish a high-frequency, low-latency trading infrastructure driven by probabilistic AI models and rigorous deterministic fallback checks.

---

## 1. Technical Architecture & Component Interface
### Current Production Flow (v4.2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           n8n ORCHESTRATION PIPELINE                        │
│                                                                             │
│  ⏰ Cron 5min (9-15, Mon-Fri)                                              │
│     → Angel One Login & Trading Hour Filter                                │
│     → Fetch 1Min & 5Min Candles (Angel One)                                │
│     → NIFTY Spot LTP & India VIX (TradingView Scanner)                     │
│     → Download Option Chain Data                                           │
│     → POST /api/predict (FastAPI Python Inference Engine)                  │
│          ↳ Calculates 18 Technicals & 9 Greeks / Derivatives               │
│          ↳ XGBoost ML Processing (or Logic v3.0 fallback)                  │
│          ↳ Output: BUY_CE / BUY_PE / WAIT                                  │
│     → IF Signal == BUY CE / BUY PE                                         │
│          ↳ Log 64-field Telemetry Matrix → Supabase `signals` Table        │
│          ↳ Prepare Dhan Order (Select ATM option via Option Chain)         │
│          ↳ Place Entry Pattern (Dhan)                                      │
│          ↳ Calculate Atomic SL (-12 pts) & Target (+25 pts)                │
│          ↳ Place SL & Target (Parallel Leg)                                │
│          ↳ Log Active Trade → Supabase `active_trades` Table               │
│                                                                             │
│  ⏰ Cron 1min (Exit Monitor)                                               │
│     → Fetch Dhan Holdings                                                  │
│     → Compare with Supabase Active Trades                                  │
│     → Dynamic Trailing Stop Loss Updates via Dhan API                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

The Zenith framework operates on a highly decoupled microservice architecture, separating data orchestration, predictive inference, order execution, and terminal visualization.

### A. Orchestration Layer (n8n Automatrix)
- **Rhythmic Ingestion:** Built around a strict 5-minute chron job (09:15 - 15:30 IST) ensuring zero drift.
- **Data Hydration:** Synchronously fetches historical OHLCV (Angel One), real-time pricing ticks (TradingView), and complex Option Chain metadata (Dhan HQ).
- **Symbology Translation:** Dynamically parses Option Chain arrays to automatically resolve the At-The-Money (ATM) Security ID, neutralizing the risk of expired contract execution.

### B. Inference Engine (Python / FastAPI)
- **High-Dimensional Extraction:** Transforms raw JSON ticks into a standardized *57-Column Numeric Feature Matrix* via `pandas`/`numpy`.
- **Probabilistic Core:** An `XGBoost` classifier predicting `BUY_CE`, `BUY_PE`, or `WAIT`. Trained strictly on historically back-tested Supabase ledger data.
- **Deterministic Check-Valve:** A 25-step rule-based `signal_engine` acts as an absolute governor. If the XGBoost model confidence falls below the strict `>0.82` threshold, the classical Rules Engine takes command, utilizing ADX, SuperTrend, and Gamma levels to secure capital.

### C. Execution & Risk Routing
- **Latency Optimization:** Order logic bypasses intermediate states by compiling Bracket payloads natively in n8n and executing via direct Dhan REST APIs.
- **Atomic SL/Target Lock:** Stop Losses (-12 pts) and Targets (+25 pts) are never assumed. They are strictly calculated off the **actual exchange-returned fill price** to nullify latency slippage discrepancies.

---

## 2. Strategic Logic & AI Processing Models

The system is designed not just to trade, but to understand market regimes and gracefully abstain from low-probability environments.

### A. The 'WAIT' Intelligence State
Traditional bots bleed capital in sideways chop. Zenith is explicitly trained to categorize "Ranging" price action.
- **VIX Guard:** Hard system lock if India VIX > 25.
- **ADX Penalty Ladder:** If ADX < 20, Total Confidence is aggressively throttled (`score × 0.5`), forcing the system into the `SIDEWAYS` preservation state.
- **Volume Phantom-Flip:** Momentum indicators are ignored if they lack corresponding volume expansions, eliminating "fake-outs."

### B. Feature Matrix (The 57 Nodes)
The AI does not look at "crossovers"; it analyzes environmental geometry:
1. **Derivatives Matrix:** Gamma Exposure (GEX), Implied Volatility (IV) Skew, Put-Call Ratio (PCR).
2. **Momentum Matrix:** Divergence algorithms mapping RSI against trailing MACD histograms.
3. **Temporal Decay:** Time-of-day constraints penalize signals after 14:30 IST to combat theta decay in options premiums.

---

## 3. Data Science & UI Design System

### A. Persistent Memory (Supabase PostgreSQL)
Supabase provides hyper-responsive data streams while serving as the training ground for the AI.
- **Signals Ledger:** 64 columns capturing the exact market snapshot at the moment of inference.
- **Automated ML Pipeline:** The `ml_training_export` SQL View strips out categorical noise, feeding a mathematically pure array directly into `api/scripts/train_model.py`.

### B. Command Center Layout (React/TypeScript)
- **Aesthetic:** Quantum Dark glassmorphism. Intentionally designed to reduce cognitive load via muted slate backgrounds (`#070b14`) and stark, high-contrast typography (Inter / JetBrains Mono).
- **Reactive State:** Powered by `useTrading.ts`, utilizing asynchronous polling to maintain live 1-to-1 parity with the Supabase PostgreSQL ledger.

---

## 4. Master Development Plan (Road to v5.0)

This is the strategic roadmap for expanding Zenith from a high-performance bot into an institutional-grade algorithmic desk.

| Phase | Vector | Strategic Goal / Implementation Detail |
|---|---|---|
| **Phase 1** | **Dynamic Capital Scaling** | Implement logic to scale lot sizes based on (a) Account Equity, and (b) XGBoost Probability Score. (e.g., 90% confidence = 2 lots, 75% = 1 lot). |
| **Phase 2** | **Sentiment Matrix Integration** | Expand the 57-feature model to 60+ features by pulling FII/DII End-of-Day positioning and correlating it with Intraday PCR shifts. |
| **Phase 3** | **Local Architecture Hardening** | Fully containerize the Python AI Engine and React Desktop environment via Docker for robust, 100% local operation without external cloud dependencies. Guarantee sub-80ms local execution without data leaving the machine. |
| **Phase 4** | **Paper-Trading Simulator** | Build a strict execution switch in the React Dashboard that isolates the Dhan API endpoints, allowing the engine to run live and write to Supabase, but faking order execution for risk-free forward-testing. |
| **Phase 5** | **Self-Healing ML Operations** | Automate the executing of `train_model.py` every Friday after market close. If validation accuracy exceeds the current baseline, automatically serialize and swap the `model.pkl` in production. |

---
*“Systems do not rise to the level of their expectations; they fall to the level of their design.”*
