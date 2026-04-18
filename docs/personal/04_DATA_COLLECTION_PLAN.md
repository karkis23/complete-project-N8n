# 04 — Data Collection Plan: How We Train the AI
*Updated: April 18, 2026 (v5.1 OHLC-Enhanced Architecture)*

---

## The Core Concept: Teaching the AI Requires Labeled Data

An AI cannot learn from raw market data alone. It needs to know not just what the market looked like (the 64 telemetry points), but also what ACTUALLY happened after (did the market go up or down in the next 60 minutes?). This pairing is called "labeled data."

---

## Step 1: Collect Raw Data ✅ ACTIVE

### 1a. Signal Data — `signals` Table (Since March 2026)
The **Supabase v5.0** `signals` table logs every 5-minute market snapshot:
- **64 Telemetry Columns** (Price, RSI, MACD, deep GEX, IV Skew, Stochastic, etc.)
- What the Rule Engine predicted (WAIT, AVOID, BUY CE, etc.)
- Metadata and Timestamps

**Current Status:**
- **1,306 rows** collected across **12 active trading days** (Mar 24 – Apr 17, 2026)
- Zero missing datapoints. 100% sync rate.

### 1b. OHLC Candle Data — `ohlc_candles` Table (NEW: April 2026)

> [!IMPORTANT]
> As of April 18, 2026, the system now **persistently stores raw 5-minute OHLCV candles** from Angel One. This was a critical missing piece — previously, candle data was fetched, processed, and discarded every cycle.

**Why This Matters:**
- The `signals` table only records `spot_price` (a single close value). It misses intra-bar highs and lows.
- The Oracle labeler needs High/Low data for accurate first-hit threshold detection.
- Future model retraining can recompute all technical indicators from raw candles.

**Current Status:**
- **975 candles** stored (13 trading days: Mar 24 – Apr 17, 2026)
- **75 candles per day** (exact: 09:15–15:25 IST)
- **Automatic ingestion** via n8n workflow (parallel to Python AI Engine call)
- **30 days backfilled** via `api/scripts/backfill_ohlc.py`
- **Deduplication** via UNIQUE constraint on `(symbol, timeframe, candle_time)`

### Data Volume Hierarchy
| Level | Signal Rows | OHLC Candles | Time | Reliability |
| :--- | :--- | :--- | :--- | :--- |
| **Current** | **1,306** | **975** | ~3 weeks | ✅ Collecting |
| **Minimum for Training** | 1,500+ | 1,125+ | 1 Month | Medium |
| **Recommended** | 5,000 | 3,750 | 4 Months | High |
| **Professional** | 10,000+ | 7,500+ | 8+ Months | Excellent |

---

## Step 2: The ML Oracle v2 (OHLC-Powered Labeling)

> [!NOTE]
> **Major Upgrade**: The Oracle has been redesigned from v1 (signal-based) to v2 (OHLC-based). See `docs/personal/ohlc_oracle_v2_breakdown.md` for the complete design breakdown.

### Why v2 is Superior to v1
| Aspect | Oracle v1 (Old) | Oracle v2 (New) |
|---|---|---|
| **Price Source** | `signals.spot_price` (close only) | `ohlc_candles.high` + `ohlc_candles.low` |
| **Interval** | Variable (5–8 min due to n8n jitter) | Exact 5-min candles |
| **Detection** | Simple max/min check | **First-hit** detection with time-ordering |
| **Delta Adjustment** | ❌ Not applied (used raw ±25pts) | ✅ Correctly uses ±50/±30 pts (delta=0.5) |

### The Corrected Labeling Thresholds (Delta-Adjusted)

Your actual trade setup: ATM NIFTY Options | Target: +25pts premium | SL: -15pts premium | Delta ≈ 0.5

| Parameter | Option Premium | NIFTY Spot Equivalent |
|---|---|---|
| **CE Target** | +25 pts | +25 / 0.5 = **+50 pts** |
| **CE Stop Loss** | -15 pts | -15 / 0.5 = **-30 pts** |
| **PE Target** | +25 pts | -25 / 0.5 = **-50 pts** |
| **PE Stop Loss** | -15 pts | +15 / 0.5 = **+30 pts** |
| **Window** | — | **60 minutes** (12 candles) |

### The Labeling Logic (Updated for OHLC)

| Outcome within 60 mins (using candle High/Low) | Label | Meaning |
|---|---|---|
| Candle HIGH ≥ spot + 50 pts (hit first) | `0` | BUY CE was correct |
| Candle LOW ≤ spot − 50 pts (hit first) | `1` | BUY PE was correct |
| Neither target hit / SL hit first / window expired | `2` | WAIT was correct |

### Simulated Label Distribution (From Real 975-Candle Dataset)

| Label | Count | Percentage |
|---|---|---|
| **0 (BUY CE)** | 307 | 37.5% |
| **1 (BUY PE)** | 216 | 26.4% |
| **2 (WAIT)** | 296 | 36.1% |

> This is **significantly more balanced** than the v1 prediction of ~80% WAIT. The high volatility of the Mar–Apr 2026 period (avg daily range: 362 pts) makes 50-pt moves routine.

---

## Step 3: Run the Training Script

Once the `label` column is populated by Oracle v2 in Supabase, we run:
```powershell
cd api
.venv\Scripts\python.exe scripts/train_model.py
```

The training script will:
1. Query the `ml_training_export` SQL View from Supabase (57 numeric features + label).
2. Split the data 80/20 for training and validation.
3. Apply `sample_weight` to balance CE/PE/WAIT classes.
4. Train the XGBoost classifier with GPU acceleration.
5. Save the artifacts to `api/models/`:
   - `signal_xgb_v1.pkl` (The AI Brain)
   - `feature_scaler.pkl` (Normalizer)

---

## Step 4: Full AI Activation

The next time the Python server starts, it detects the `.pkl` file and switches from `RULES_FALLBACK` to **AI_ENSEMBLE** mode automatically. No n8n structural changes are required.

---

## n8n Workflow Changes (April 18, 2026)

Two new nodes added to `LIVE TEST DATABASE` workflow (`cVkMUvsXXmTKCc3t`):

| Node | Type | Purpose |
|---|---|---|
| `Extract Latest Candle` | Code (JS) | Extracts last candle from Angel One response, formats for Supabase |
| `Store OHLC to Supabase` | Supabase Insert | Upserts candle into `ohlc_candles` with deduplication |

**Wiring**: Runs in **parallel** with `🧠 Call Python AI Engine` (zero latency impact):
```
Option Chain Request1
  ├──→ 🧠 Call Python AI Engine       (unchanged)
  └──→ Extract Latest Candle → Store OHLC to Supabase  (NEW)
```

---

## Backfill Script

**File**: `api/scripts/backfill_ohlc.py`

One-time script to populate historical candle data:
1. Authenticates with Angel One (TOTP required)
2. Fetches 30 days of 5-min candles in 5-day batches
3. Parses into `ohlc_candles` schema format
4. Bulk inserts with `ON CONFLICT DO NOTHING` (PostgREST)
5. Verifies data in Supabase

**Last Run**: April 18, 2026 — 975 candles inserted, 600 duplicates skipped.

---

## Current Professional Status

| Component | Status | Details |
|---|---|---|
| Signal Collection | ✅ Live | 1,306 rows, 12 trading days |
| OHLC Storage | ✅ Live | 975 candles, 13 trading days, auto-ingesting |
| Historical Backfill | ✅ Complete | 30 days backfilled |
| Oracle v2 Design | ✅ Documented | OHLC-powered, delta-adjusted |
| Oracle v2 Script | 🟡 Next Step | `oracle_labeler_v2.py` |
| XGBoost Training | ⬜ Pending | Awaiting Oracle labels |
| AI Activation | ⬜ Pending | Awaiting trained model |

> *"The engine is perfected. The database is trapping the light — both signal telemetry AND raw candle data. The Oracle is designed. We are ready to label."*
