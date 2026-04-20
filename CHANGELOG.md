# Zenith — CHANGELOG

All notable changes to the Zenith Quantum Trading System are documented here.

---

## [v5.1.3] — 2026-04-21 — Live Candlestick & Order Book Integration

### 🐛 Bug Fix: Lightweight-Charts Initializer Crash
**Problem**: The application failed to render (black screen) with an `Invalid time` and missing method error logged to the browser engine console.
- **Root Cause**: Version 5.1.0 of `lightweight-charts` deprecated the legacy `addCandlestickSeries()` syntax in favor of the new explicit declarative syntax `addSeries(CandlestickSeries)`. Additionally, empty or NaN timestamp values in signal datasets bypassed validation, breaking mathematical array reductions.
- **Fix**: Upgraded chart invocation logic to adhere to the v5 specification and introduced rigid time validation checks before rendering mathematical markers onto chart data.

### ✨ New Feature: Order Book Visualization
- Deployed `/orders` tab to elegantly visualize the active tracking logic occurring within the `active_exit_orders` database table.
- Simulates real-time bracket limits (Stop-Loss and Target) tracking side-by-side with localized Risk/Reward and PNL metrics.

---

## [v5.1.2] — 2026-04-20 — Frontend Performance Optimization

### ⚡ Performance Fix: UI DOM Overload (Browser Freeze)

**Problem**: The application became extremely slow and would freeze the browser when navigating to the `SignalsPage`, `HistoryPage`, and `ValidationPage`.
- **Root Cause**: The global `useTrading` hook pulls up to `20,000` signals and `5,000` trade histories into memory to compute live global statistics cleanly. However, these specific UI pages were performing unpaginated `.map()` loops over the entire arrays and attempting to render up to 20,000 React DOM elements at once, which crashed/froze the browser render thread.
- **Fix**: Implemented strict, local `<Virtual Pagination>` mechanisms using `slice` across these three heavy-rendering files:
  - `src/pages/SignalsPage.tsx`
  - `src/pages/HistoryPage.tsx`
  - `src/pages/ValidationPage.tsx`

**Impact**: 
1. Pages now only render a safe maximum of `50` rows at any given time.
2. Clean `Previous/Next` pagination controls seamlessly allow data navigation through the 20,000 loaded records without freezing.
3. Pagination states correctly reset via `useEffect` whenever filters, tabs, or date boundaries are modified.

---

## [v5.1.1] — 2026-04-20 — OHLC Upsert Fix (Duplicate Key Resolution)

### 🐛 Bug Fix: `Store OHLC to Supabase` Duplicate Key Error

**Problem**: The `Store OHLC to Supabase` Supabase node used `Operation: Create` (INSERT), which failed with:
```
duplicate key value violates unique constraint "ohlc_candles_symbol_timeframe_candle_time_key"
```
This occurred whenever the workflow re-ran within the same 5-minute window (e.g., retries, overlapping executions), because a row with the same `(symbol, timeframe, candle_time)` already existed.

**Root Cause**: The n8n Supabase node only supports `Create` (INSERT) — it has no native `Upsert` operation. A plain INSERT always fails on duplicate unique keys.

**Fix**: Merged the `Extract Latest Candle` and `Store OHLC to Supabase` nodes into a **single Code node** that:
1. Extracts the latest 5-min candle (unchanged logic)
2. Performs an **HTTP upsert** directly via PostgREST with header `Prefer: resolution=merge-duplicates`
3. This translates to PostgreSQL `ON CONFLICT (symbol, timeframe, candle_time) DO UPDATE`
4. Passes candle data downstream regardless of upsert result

### ⚡ n8n Workflow Changes

#### Workflow: `LIVE TEST DATABASE` (`cVkMUvsXXmTKCc3t`)
**Node count**: 41 → **40** (2 nodes merged into 1)

| Change | Details |
|---|---|
| ❌ Removed | `Store OHLC to Supabase` (Supabase Insert node `ohlc-store-002`) |
| ✏️ Updated | `Extract Latest Candle` — now handles both extraction AND upsert via `fetch()` |

**Updated Wiring** (serial — upsert completes before AI engine call):
```
Option Chain Request1
  └──→ Extract Latest Candle (extract + upsert) → 🧠 Call Python AI Engine
```

**How the upsert works:**
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/ohlc_candles`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'  // ← ON CONFLICT DO UPDATE
  },
  body: JSON.stringify(candleData)
});
```

### ✅ Supabase Verification
- **RLS Policy**: `Service role full access on ohlc_candles` — permits INSERT + UPDATE for anon key
- **Unique Constraint**: `UNIQUE(symbol, timeframe, candle_time)` — correctly used by PostgREST for conflict resolution
- **No schema changes required** — existing database structure fully supports the upsert

---

## [v5.1.0] — 2026-04-18 — OHLC Storage & Oracle v2 Architecture

### 🏗️ Database Changes

#### New Table: `ohlc_candles`
- **Purpose**: Persistent storage for raw 5-minute OHLCV candle data from Angel One
- **Schema**: `candle_time`, `open`, `high`, `low`, `close`, `volume`, `symbol`, `timeframe`, `session_date`, `source`
- **Indexes**: Composite index on `(symbol, timeframe, candle_time)` for fast lookups
- **Constraints**: `UNIQUE(symbol, timeframe, candle_time)` for deduplication
- **RLS**: Enabled with service-role access (matching existing system patterns)
- **Storage**: ~3.6 MB/year at current ingestion rate
- **File**: `n8n/supabase_schema.sql` updated with full table definition

#### Data Loaded
- **975 candles** backfilled (13 trading days: 2026-03-24 → 2026-04-17)
- **75 candles/day** (exact 5-min intervals: 09:15–15:25 IST)
- No gaps, no missing data

---

### ⚡ n8n Workflow Changes

#### Workflow: `LIVE TEST DATABASE` (`cVkMUvsXXmTKCc3t`)
**Node count**: 39 → **41** (2 new nodes added)

| New Node | Type | ID | Purpose |
|---|---|---|---|
| `Extract Latest Candle` | Code (JS) | `ohlc-extract-001` | Extracts the last 5-min candle from Angel One response |
| `Store OHLC to Supabase` | Supabase Insert | `ohlc-store-002` | Inserts candle into `ohlc_candles` with dedup |

**Wiring** (parallel execution — zero latency impact):
```
Option Chain Request1
  ├──→ 🧠 Call Python AI Engine       (existing — unchanged)
  └──→ Extract Latest Candle → Store OHLC to Supabase  (NEW)
```

**How it works:**
1. `Extract Latest Candle` references `$('Get 5Mins Candles1').first().json.data`
2. Takes the last candle from the array (most recent 5-min bar)
3. Formats it with IST session date and symbol metadata
4. `Store OHLC to Supabase` inserts to `ohlc_candles` using credential `aeuolv0JKstQoY5l`

---

### 🐍 New Scripts

#### `api/scripts/backfill_ohlc.py`
One-time Python script for historical data backfill:
- Authenticates with Angel One (TOTP required)
- Fetches 30 days of 5-min NIFTY candles in 5-day batches (6 API calls)
- Parses candles into `ohlc_candles` schema format
- Bulk inserts via Supabase REST API with `Prefer: resolution=ignore-duplicates`
- Includes verification step (queries latest rows after insert)

**First Run Results** (April 18, 2026):
- 1,575 candles fetched
- 975 inserted (new)  
- 600 skipped (duplicates from overlapping date ranges)
- Duration: 14.0 seconds

**Dependencies**: `requests`, `python-dateutil` (both already in `requirements.txt`)

---

### 📄 New Documentation

#### `docs/personal/ohlc_oracle_v2_breakdown.md`
Comprehensive design breakdown for Oracle Labeler v2:
- Full data reality check with real database numbers
- Simulated label distribution from 975 OHLC candles (37.5% CE / 26.4% PE / 36.1% WAIT)
- Per-day label breakdown across 13 trading days
- Delta-adjusted threshold spec (±50/±30 NIFTY spot)
- v1 vs v2 architecture comparison
- Implementation plan for `oracle_labeler_v2.py`

---

### 📝 Updated Documentation

| File | Changes |
|---|---|
| `README.md` | Schema → v5.1, added OHLC table section, added scripts table, added OHLC pipeline diagram |
| `docs/personal/04_DATA_COLLECTION_PLAN.md` | **Major rewrite**: OHLC storage, Oracle v2 spec, delta-adjusted thresholds, backfill script, updated status with real numbers |
| `docs/personal/07_CONTINUOUS_RETRAINING.md` | Updated Oracle references to v2, corrected thresholds from ±35/±15 to delta-adjusted ±50/±30 |
| `docs/personal/16_DATA_LABELLING_ORACLE_CONCEPT.md` | Updated labeling logic to v2 OHLC-powered, added High/Low first-hit detection, updated database status |
| `n8n/supabase_schema.sql` | Added `ohlc_candles` table definition, indexes, and RLS policies |

---

### 🔮 Architecture: Why This Matters

#### Before v5.1 (Stateless)
```
Angel One API → n8n → Python API → Compute indicators → Log signal → Discard candles
```
- Raw OHLCV data was fetched, processed, and **permanently lost** every 5 minutes
- Oracle could only label using `signals.spot_price` (a single close value)
- No ability to recompute features or detect intra-bar price spikes
- Every day without storage = permanent data loss

#### After v5.1 (Data-Driven)
```
Angel One API → n8n → Python API → Compute indicators → Log signal
                  └── PARALLEL ──→ Store raw candle to ohlc_candles
```
- Raw OHLCV data is **permanently stored** with zero latency impact
- Oracle v2 uses High/Low for precise first-hit threshold detection
- Model retraining can recompute all indicators from raw candles
- Full backtesting with complete intra-bar price data

---

### 📊 System Status After v5.1

| Component | Status | Count |
|---|---|---|
| Signals (features) | ✅ Live | 1,306 rows / 12 days |
| OHLC Candles (price) | ✅ Live | 975 rows / 13 days |
| n8n Parallel Storage | ✅ Active | 41-node workflow |
| Historical Backfill | ✅ Complete | 30 days loaded |
| Oracle v2 Design | ✅ Documented | Ready to build |
| Oracle v2 Script | 🟡 Next Step | `oracle_labeler_v2.py` |
| XGBoost Training | ⬜ Pending | Awaiting labels |

---

## [v5.0.0] — 2026-03-24 — Supabase v5.0 Schema & Data Incubation

- Migrated from Google Sheets to Supabase PostgreSQL
- Created `signals` table with 64-column feature matrix
- Added `ml_training_export` SQL View for automated feature extraction
- Added `label` and `label_source` columns for Oracle labeling
- Began Data Incubation Phase
- Deployed n8n `LIVE TEST DATABASE` workflow (39 nodes)

---

## [v4.3.0] — 2026-03 — Live Database & Signal Normalization  

- Full 64-column feature matrix capture (100% sync rate)
- Signal normalization: `BUY CALL (CE)` → `BUY CE`, `BUY PUT (PE)` → `BUY PE`
- GEX, IV Skew, PCR logging verified at 0 missing metrics
- `WAIT`, `AVOID`, `SIDEWAYS` states now logged (previously only BUY signals)

---

*Zenith — Advanced Trading Intelligence*
