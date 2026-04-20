# 💠 Zenith Quantum Terminal v4.2.0

Zenith is a premium, high-frequency trading dashboard designed for the Indian Derivatives market (Nifty/BankNifty). It acts as a real-time visualization and audit layer for a remote Python-based Alpha Engine.

## 🏗️ System Architecture

### 1. Data Orchestration (`useTrading.ts`)
The application uses a centralized React Hook to manage all telemetry. 
- **Dynamic Polling**: Automatically adjusts sync frequency based on IST market hours (30s during market, 3m after hours).
- **Graceful Failover**: Uses `Promise.allSettled` to ensure UI parts remain functional even if specific engine diagnostics fail.

### 2. Atomic Price Locking (`ValidationPage.tsx`)
To solve the problem of "result-flipping" in signal audits, Zenith implements an atomic locking mechanism:
- **Phase 1 (Pending)**: Signals < 10m old are not evaluated.
- **Phase 2 (Live)**: Signals 10m-30m old are compared against the *live* Nifty spot price.
- **Phase 3 (Locked)**: Once a signal is > 30m old, the system searches the database for a signal generated ~15m after the entry and "anchors" the comparison price. This ensures historical win rates remain mathematically stable.

### 3. Strategy Lab Engine (`BacktestPage.tsx`)
A high-fidelity simulation environment that uses a **Hybrid Execution Model**:
- **Broker Match**: If a simulated signal matches a real-world executed trade, it uses official broker PnL (including slippage).
- **Probabilistic Fill**: If no real trade exists, it uses a deterministic RNG seeded by signal time to simulate outcomes based on confidence scores.

### 4. Design System (`index.css` & `Sidebar.tsx`)
- **Aesthetic**: "Quantum Dark" glassmorphism.
- **Micro-interactions**: Pulse animations for live connectivity, smooth slide-ins for expanded table rows.
- **Typography**: Optimized using `Inter` for UI and `JetBrains Mono` for financial telemetry.

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Data Layer**: Supabase (PostgreSQL), Axios
- **Charts**: Recharts (High-performance SVG)
- **Icons**: Lucide React

## 📊 Database Schema — v5.1.1 (OHLC-Enhanced + Upsert)

### `public.signals` — ML Feature Store
Captures exactly 64 data points every 5 minutes:
- **Metadata**: Core timestamps, session dates, execution processing time.
- **Market Context**: Spot prices, VIX multipliers, and session progress.
- **Technical Matrix (18 features)**: RSI, MACD, ADX, Momentum, Stochastic, CCI, MFI, Bollinger Bands.
- **Derivatives & GEX (9 features)**: PCR, Gamma Exposure, IV Skew, Max Pain, GEX Regimes.
- **Signal Logic**: Confidence, AI insights, reasons, and state/streak metrics.
- **Oracle Labels**: `label` (0=CE, 1=PE, 2=WAIT) + `label_source` — populated by Oracle v2.

### `public.ohlc_candles` — Raw Price Backbone (NEW: April 2026)
Stores raw 5-minute OHLCV candle data from Angel One. Used for:
- **Oracle Labeling**: High/Low of each candle enables precise first-hit detection.
- **Model Retraining**: Recompute features from raw candles without needing live API calls.
- **Backtesting**: Complete intra-bar price data for accurate strategy simulation.

| Column | Type | Description |
|---|---|---|
| `candle_time` | TIMESTAMPTZ | Candle open time (PK with symbol+timeframe) |
| `open/high/low/close` | DECIMAL | OHLC price data |
| `volume` | DECIMAL | Bar volume |
| `symbol` | TEXT | `NIFTY 50` |
| `timeframe` | TEXT | `5min` |
| `session_date` | DATE | Trading day (IST) |

**Storage**: ~975 rows per 13 trading days. ~3.6 MB/year. Deduplication via UNIQUE constraint.

### Automated ML Pipeline (`ml_training_export`)
The database contains a built-in SQL View that automatically structures the 64 columns into the exact **57 numeric features** required by the Python XGBoost engine (`train_model.py`), fully bypassing manual CSV data wrangling.

## 🚀 Key Features
- **Global Search & Date Filters**: Deep drill-down into signals and audit logs across all pages.
- **Telemetery Sync**: Real-time tracking of Python Engine health, database sync, and live feed latency.
- **Deep Telemetry**: Technical matrix (RSI, ADX, PCR, GEX, IV Skew) for every generated signal.

## 🤖 n8n Workflows (Production)
The system relies on these two primary active workflows:
- **LIVE TEST DATABASE** (`cVkMUvsXXmTKCc3t`): Handles live signal ingestion, Supabase persistence, **and OHLC candle storage** (40 nodes).
- **excution (Archived)** (`E9VXtjxIzDOirmv3`): Manages order execution and broker connectivity.

### OHLC Storage Pipeline (v5.1.1 — April 2026)
The `Extract Latest Candle` code node handles both candle extraction AND Supabase upsert in a single step, then feeds data to the AI engine:
```
Option Chain Request1
  └──→ Extract Latest Candle (extract + upsert via PostgREST)
       └──→ 🧠 Call Python AI Engine   (signal generation)
```
Uses `Prefer: resolution=merge-duplicates` header for `ON CONFLICT DO UPDATE` — no duplicate key errors.

## 🧪 Scripts
| Script | Location | Purpose |
|---|---|---|
| `backfill_ohlc.py` | `api/scripts/` | Fetches 30 days of 5-min candles from Angel One → Supabase |
| `train_model.py` | `api/scripts/` | XGBoost model training from labeled signals data |
| `test_api.py` | `api/scripts/` | API endpoint testing |

---
*Zenith — Advanced Trading Intelligence*