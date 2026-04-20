# 🔮 Oracle Labeler v2 — OHLC-Powered Design Breakdown

> **Context**: Building the Oracle labeling system using the new `ohlc_candles` table (975 rows, 13 trading days).  
> **Upgrade**: The v1 Oracle used `signals.spot_price` (noisy, variable intervals). v2 uses **raw 5-min OHLCV candles** with precise HLOC data for first-hit detection.  
> **Trading Setup**: ATM NIFTY Options | Target: +25pts | SL: −15pts | Delta ≈ 0.5

---

## 1. The v1 → v2 Architecture Shift

### Why v1 (Signal-Based Oracle) Was Flawed

The original Oracle design used the `signals` table to look ahead:

```
signals table → spot_price at each signal → compare future spot_price rows
```

**Problems:**  
1. **Variable intervals** — n8n fires every 5–8 minutes, not exactly 5:00. Timestamp-based windowing is fuzzy.  
2. **Only `close` data** — `signals.spot_price` is a single point. It misses **intra-candle highs and lows**, meaning a spike to +55pts that reversed within the same candle would be invisible.  
3. **Sparse data** — Only 1,306 signal rows across 12 days. Many gaps.

### Why v2 (OHLC-Based Oracle) Is Superior

The new architecture uses `ohlc_candles` as the price backbone:

```
ohlc_candles table → High/Low at each 5-min bar → precise first-hit detection
signals table      → timestamp + features → JOIN to ohlc_candles for labeling
```

**Advantages:**  
1. **Exact 5-min intervals** — Every candle is precisely 5 minutes. No jitter.  
2. **High/Low coverage** — Each candle has `high` and `low`, catching intra-bar spikes.  
3. **975 candles** across 13 days = 75 candles/day = exactly one per 5-min bar from 09:15 to 15:30.  
4. **Decoupled** — Oracle labeling is independent of signal frequency. Even if n8n skips a cycle, the candle data is continuous.

> [!IMPORTANT]  
> The v2 Oracle labels the `signals` table rows by **JOINing** each signal's timestamp to the `ohlc_candles` table, then walking forward through 12 candles (60 minutes) checking High/Low for threshold breaches.

---

## 2. Your Live Data Reality Check (From Database)

### 2a. OHLC Candles Summary

| Metric | Value |
|---|---|
| **Total Candles** | 975 |
| **Trading Days** | 13 |
| **Date Range** | 2026-03-24 → 2026-04-17 |
| **Candles per Day** | 75 (exactly correct: 09:15–15:25 = 75 bars) |
| **Avg Candle Range** | 32.89 pts |
| **Max Candle Range** | 206.55 pts |

### 2b. Daily Range Analysis (NIFTY Spot)

| Date | Daily Range | Day Low | Day High | Character |
|---|---|---|---|---|
| 2026-04-17 | **275.85** | 24,096 | 24,372 | Trending ↑ |
| 2026-04-16 | **298.15** | 24,103 | 24,401 | Strong trend |
| 2026-04-15 | **135.10** | 24,146 | 24,281 | 🐌 Low range |
| 2026-04-13 | **351.80** | 23,556 | 23,907 | 🔥 Breakout |
| 2026-04-08 | **196.65** | 23,829 | 24,025 | Moderate |
| 2026-04-07 | **434.55** | 22,719 | 23,154 | 🔥 Big trend |
| 2026-04-06 | **455.40** | 22,543 | 22,998 | 🔥 Big trend |
| 2026-04-02 | **599.75** | 22,183 | 22,782 | 🔥🔥 Massive |
| 2026-04-01 | **322.70** | 22,619 | 22,941 | Strong trend |
| 2026-03-30 | **430.25** | 22,284 | 22,714 | 🔥 Big trend |
| 2026-03-27 | **381.55** | 22,805 | 23,186 | Strong trend |
| 2026-03-25 | **402.15** | 23,063 | 23,465 | 🔥 Big trend |
| 2026-03-24 | **433.10** | 22,624 | 23,057 | 🔥 Big trend |

**Key Insight:** Average daily range = **362.5 pts**. This is an unusually volatile period (tariff war era). A 50-pt target is just **13.8%** of the average daily range — very achievable.

### 2c. Signal Distribution (Current)

| Signal | Count | Percentage |
|---|---|---|
| **WAIT** | 625 | 47.9% |
| **AVOID** | 417 | 31.9% |
| **SIDEWAYS** | 126 | 9.7% |
| **MARKET_CLOSED** | 120 | 9.2% |
| **BUY CALL (CE)** | 13 | 1.0% |
| **BUY PUT (PE)** | 4 | 0.3% |
| **BUY CE** | 1 | 0.1% |
| **Total** | **1,306** | 100% |

> [!NOTE]  
> `BUY CE` (1 row) is from the normalized label. `BUY CALL (CE)` (13 rows) is the legacy format. Both represent the same signal — this was addressed in the normalization pass but 13 legacy rows remain.

---

## 3. The Game-Changer: Simulated Label Distribution

I ran the **exact Oracle labeling logic** against the 975 OHLC candles using SQL. Here are the results:

### 3a. Overall Label Distribution (First-Hit, Delta-Adjusted)

| Label | Meaning | Count | Percentage |
|---|---|---|---|
| **0 (BUY CE)** | Spot rose ≥50pts before falling ≥30pts | **307** | **37.5%** |
| **1 (BUY PE)** | Spot fell ≥50pts before rising ≥30pts | **216** | **26.4%** |
| **2 (WAIT)** | Neither target hit / SL killed it / window expired | **296** | **36.1%** |
| **Total** | | **819** | 100% |

> [!IMPORTANT]  
> **THIS CHANGES EVERYTHING.** The v1 design predicted ~80% WAIT labels. The actual data shows **only 36.1% WAIT**. This is because the recent market has been extremely volatile (daily ranges of 300–600 pts). A 50-pt move within 60 minutes is routine during this tariff-war period.

> [!CAUTION]  
> **Market Regime Bias**: These 13 days represent a **high-volatility regime** (avg daily range 362 pts). During low-volatility periods (avg range ~100 pts), WAIT labels will dominate (~70%+). The Oracle must be re-run when new data arrives to maintain accurate label distributions.

### 3b. Per-Day Label Breakdown

| Date | Daily Range | CE Wins | PE Wins | WAIT | Character |
|---|---|---|---|---|---|
| 2026-04-17 | 275.85 | 17 (27%) | 2 (3%) | **44 (70%)** | ↑ Persistent uptrend |
| 2026-04-16 | 298.15 | 16 (25%) | **31 (49%)** | 16 (25%) | ↕ Volatile reversal |
| 2026-04-15 | 135.10 | 9 (14%) | 9 (14%) | **45 (71%)** | 🐌 WAIT-dominated |
| 2026-04-13 | 351.80 | **34 (54%)** | 8 (13%) | 21 (33%) | 🔥 Bull breakout |
| 2026-04-08 | 196.65 | **26 (41%)** | 16 (25%) | 21 (33%) | Moderate trend |
| 2026-04-07 | 434.55 | **30 (48%)** | 12 (19%) | 21 (33%) | Strong bull |
| 2026-04-06 | 455.40 | **39 (62%)** | 11 (17%) | 13 (21%) | 🔥🔥 Bull day |
| 2026-04-02 | 599.75 | **29 (46%)** | 3 (5%) | 31 (49%) | Gap-up trend |
| 2026-04-01 | 322.70 | 20 (32%) | **30 (48%)** | 13 (21%) | Bear reversal |
| 2026-03-30 | 430.25 | 16 (25%) | **33 (52%)** | 14 (22%) | 🔥 Bear trend |
| 2026-03-27 | 381.55 | 7 (11%) | **31 (49%)** | 25 (40%) | ↓ Bear breakdown |
| 2026-03-25 | 402.15 | **31 (49%)** | 13 (21%) | 19 (30%) | Bull recovery |
| 2026-03-24 | 433.10 | **33 (52%)** | 17 (27%) | 13 (21%) | Strong bull |

**Critical Observations:**

1. **Low-range days (Apr 15: 135 pts)** → 71% WAIT — exactly as predicted  
2. **High-range days (Apr 02: 600 pts)** → Only 49% WAIT — lots of opportunities  
3. **Trending days** → One label dominates (Apr 13: 54% CE, Mar 30: 52% PE)  
4. **Reversal days** → Both CE and PE fire (Apr 16: 25% CE + 49% PE)

> [!TIP]  
> The per-day patterns reveal **regime information**. On trending days, the model should learn to predict the dominant direction. On low-range days, it should predict WAIT. This is exactly the type of pattern XGBoost excels at learning from features like ADX, VIX, and session progress.

---

## 4. The Labeling Protocol (v2 — OHLC-Powered)

### 4a. Data Architecture

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│      signals (1,306 rows)   │     │   ohlc_candles (975 rows)    │
│                             │     │                              │
│  timestamp                  │     │  candle_time (5-min exact)   │
│  session_date               │◄───►│  session_date                │
│  spot_price                 │     │  open, high, low, close      │
│  signal (WAIT/BUY CE/etc)   │     │  volume                      │
│  confidence, vix, rsi...    │     │  symbol, timeframe           │
│  label (INTEGER) ← TO FILL │     │                              │
│  label_source ← TO FILL    │     │                              │
└─────────────────────────────┘     └──────────────────────────────┘
```

### 4b. The Join Strategy

For each signal row at time `T₀`:

1. **Snap to nearest candle**: Find the `ohlc_candles` row where `candle_time` is closest to `signals.timestamp` (within ±5 minutes)
2. **Walk forward 12 candles**: Get the next 12 candles (60 minutes) from `ohlc_candles` in the same `session_date`
3. **Check High/Low**: Unlike v1 which only had `close`, v2 checks both `high` and `low` of each future candle
4. **First-hit detection**: The first candle whose `high` or `low` breaches a threshold determines the label

### 4c. The Labeling Algorithm (Pseudocode)

```python
# Oracle v2 — OHLC-Powered Labeling
TARGET_SPOT_MOVE = 50    # pts (= 25 option premium pts @ Δ=0.5)
SL_SPOT_MOVE = 30        # pts (= 15 option premium pts @ Δ=0.5)
LOOKAHEAD_MINUTES = 60   # 12 candles at 5-min interval
CUTOFF_TIME = "14:45"    # Exclude signals after this (IST)

for each signal_row in signals:
    # Skip non-tradeable rows
    if signal_row.signal == 'MARKET_CLOSED':
        continue  # Cannot label — no market data exists
    
    # Skip late-session rows (insufficient lookahead)
    if signal_row.timestamp.time() > CUTOFF_TIME:
        signal_row.label = 2  # WAIT (conservative)
        signal_row.label_source = 'oracle_v2_cutoff'
        continue
    
    # Snap to nearest OHLC candle
    t0_candle = find_nearest_candle(signal_row.timestamp, signal_row.session_date)
    spot_at_t0 = t0_candle.close
    
    # Get next 12 candles
    future_candles = get_candles_after(t0_candle, minutes=60, same_session=True)
    
    # Define thresholds
    ce_target = spot_at_t0 + TARGET_SPOT_MOVE   # +50
    ce_sl     = spot_at_t0 - SL_SPOT_MOVE       # -30
    pe_target = spot_at_t0 - TARGET_SPOT_MOVE   # -50
    pe_sl     = spot_at_t0 + SL_SPOT_MOVE       # +30
    
    label = 2  # Default: WAIT
    
    # Walk through candles in TIME ORDER
    for candle in future_candles:
        # Check CE target (HIGH of candle)
        if candle.high >= ce_target:
            label = 0  # BUY CE would have hit target
            break
        # Check PE target (LOW of candle)
        if candle.low <= pe_target:
            label = 1  # BUY PE would have hit target
            break
        # Check CE stop loss (LOW of candle)
        if candle.low <= ce_sl:
            label = 2  # CE trade killed by SL
            break
        # Check PE stop loss (HIGH of candle)
        if candle.high >= pe_sl:
            label = 2  # PE trade killed by SL
            break
    
    signal_row.label = label
    signal_row.label_source = 'oracle_v2_ohlc'
```

### 4d. Why High/Low Matters (The v1 Miss)

Consider this 5-min candle:
```
Candle: Open=24100, High=24165, Low=24095, Close=24110
```

- **v1** (signals.spot_price = close only): Sees `24110`. Misses the +65pt spike.
- **v2** (ohlc.high): Sees `24165`. If CE target was `spot+50=24150`, v2 correctly labels CE WIN.

This is the difference between **incomplete data** and **complete reality**.

---

## 5. The Class Imbalance — Revised Assessment

### 5a. Actual vs. Predicted Label Distribution

| Scenario | CE (Label 0) | PE (Label 1) | WAIT (Label 2) |
|---|---|---|---|
| **v1 Prediction** (from original doc) | ~8–12% | ~8–12% | ~76–84% |
| **v2 Actual** (from OHLC simulation) | **37.5%** | **26.4%** | **36.1%** |

> [!WARNING]  
> The v1 prediction was wildly wrong because it didn't account for the extreme volatility of the current period. However, this **does not mean** the imbalance problem is solved. During low-volatility regimes, WAIT will dominate again. The model must generalize across regimes.

### 5b. Imbalance Assessment for Training

Current distribution is **remarkably balanced** — nearly equal thirds. This means:

| Strategy | v1 Verdict | v2 Verdict |
|---|---|---|
| **scale_pos_weight** | Critical | 🟡 Nice-to-have |
| **SMOTE Oversampling** | Essential | 🟢 Unnecessary (for now) |
| **Undersample WAIT** | Required | 🟢 Unnecessary (for now) |
| **Hybrid resampling** | The recommendation | 🔴 Wait — may hurt by discarding real data |

> [!TIP]  
> With 37.5% CE / 26.4% PE / 36.1% WAIT, you have a **naturally balanced dataset**. The best strategy is to train XGBoost with `sample_weight` to slightly boost PE class (the minority at 26.4%), and avoid any resampling techniques that would introduce synthetic data or lose real data.

### 5c. Per-Regime Strategy

The real imbalance will appear when you accumulate data across multiple regimes:

| Regime Period | Expected CE% | Expected PE% | Expected WAIT% |
|---|---|---|---|
| **Current (Mar–Apr 2026)** | 37.5% | 26.4% | 36.1% |
| **Low-Vol Period (future)** | ~10% | ~10% | ~80% |
| **Mixed (6+ months)** | ~20% | ~15% | ~65% |

**Recommendation**: Implement `scale_pos_weight` from the start, but don't over-engineer resampling until you have 90+ days of mixed-regime data.

---

## 6. Signal Table Labeling vs. OHLC-Only Labeling

### 6a. Which Rows Get Labeled?

Two approaches available now:

| Approach | Rows Labeled | Source | Use Case |
|---|---|---|---|
| **A: Label Signal Rows** | ~1,186 signals (excl. MARKET_CLOSED) | JOIN signals → ohlc_candles | Train model on "when the engine fires, what should it have done?" |
| **B: Label OHLC Rows** | ~819 candle windows | ohlc_candles self-join | Create a pure price-based training set independent of engine signals |

**Recommendation: Do BOTH**

- **Approach A** → Updates `signals.label` column → Used for XGBoost model training  
- **Approach B** → Creates a separate `ohlc_labels` table → Used for backtesting and regime analysis

### 6b. Signal Row Labeling — Row Inclusion Rules

| Signal Type | Count | Include? | Reason |
|---|---|---|---|
| `WAIT` (625) | **Yes** | Market was open — Oracle checks if a trade *should* have been taken |
| `AVOID` (417) | **Yes** | Engine said "don't trade" — Oracle audits if it was right |
| `SIDEWAYS` (126) | **Yes** | Same as AVOID — check the reality |
| `BUY CALL (CE)` (13) | **Yes** | Critical validation — did the BUY signal lead to a win? |
| `BUY PUT (PE)` (4) | **Yes** | Same — was the PE signal correct? |
| `BUY CE` (1) | **Yes** | Normalized format, same treatment |
| `MARKET_CLOSED` (120) | **No** | No market data exists, cannot label |

**Labelable rows: 1,186** (1,306 − 120 MARKET_CLOSED)

### 6c. End-of-Day Cutoff

Signals after **14:45 IST** (candle_time 09:15 UTC) won't have 60 minutes of future data:

- **Market closes at 15:30** → Last labelable candle = 14:25 IST (9 candles of lookahead)
- Signals between 14:25–14:45 → Use reduced window (may get partial label)
- Signals after 14:45 → **Label as WAIT** with `label_source = 'oracle_v2_cutoff'`

---

## 7. The Oracle Implementation Plan

### 7a. Script Design: `oracle_labeler_v2.py`

```
api/scripts/oracle_labeler_v2.py
├── 1. Connect to Supabase (REST API)
├── 2. Fetch all signals WHERE signal != 'MARKET_CLOSED' AND label IS NULL
├── 3. Fetch all ohlc_candles
├── 4. For each signal:
│   ├── a. Find nearest candle to signal.timestamp
│   ├── b. Walk forward 12 candles (60 min)
│   ├── c. Check High/Low for first-hit thresholds
│   ├── d. Assign label (0=CE, 1=PE, 2=WAIT)
│   └── e. Set label_source = 'oracle_v2_ohlc'
├── 5. Batch UPDATE signals SET label, label_source
├── 6. Print summary statistics
└── 7. Validate: Cross-check engine signals vs Oracle labels
```

### 7b. Validation Checks

After labeling, the script should output:

```
VALIDATION REPORT
─────────────────
1. Engine said BUY CE  → Oracle says CE WIN:  X/14 (accuracy %)
2. Engine said BUY CE  → Oracle says WAIT:    X/14 (false positives)
3. Engine said WAIT    → Oracle says CE WIN:  X/625 (missed opportunities)
4. Engine said AVOID   → Oracle says CE WIN:  X/417 (missed opportunities)
5. Label distribution: CE X% | PE X% | WAIT X%
6. Coverage: X/1186 rows labeled (X% coverage)
```

This validation report tells you:
- **How accurate the current engine is** (do its BUY signals actually win?)
- **How many opportunities it misses** (WAIT/AVOID rows where Oracle says BUY)
- **Whether the training data is balanced enough** for XGBoost

### 7c. Dependencies

| Dependency | Status | Notes |
|---|---|---|
| `ohlc_candles` table | ✅ Created | 975 rows, 13 days |
| `signals` table | ✅ Exists | 1,306 rows, `label` + `label_source` columns present |
| Date overlap | ✅ Verified | Both tables: 2026-03-24 → 2026-04-17 |
| Existing labels | ✅ Clean | `label` column is currently NULL for all rows |
| Python deps | ✅ Available | `requests`, `python-dateutil` in venv |

---

## 8. The Definitive Oracle v2 Spec

| Parameter | Value | Derivation |
|---|---|---|
| **CE Target** | Spot + **50 pts** | 25 premium pts / 0.5 delta |
| **CE Stop Loss** | Spot − **30 pts** | 15 premium pts / 0.5 delta |
| **PE Target** | Spot − **50 pts** | 25 premium pts / 0.5 delta |
| **PE Stop Loss** | Spot + **30 pts** | 15 premium pts / 0.5 delta |
| **Window** | **60 minutes** | 12 candles at 5-min interval |
| **Detection** | **First-Hit** | Check High/Low of each candle in time order |
| **Price Source** | `ohlc_candles.high` / `ohlc_candles.low` | Not signals.spot_price |
| **Label 0** | CE target hit first | `candle.high >= spot + 50` before any SL |
| **Label 1** | PE target hit first | `candle.low <= spot - 50` before any SL |
| **Label 2** | Neither/SL/Expiry | Default |
| **Cutoff** | **14:45 IST** | Rows after this → Label 2 (insufficient lookahead) |
| **Exclusions** | `MARKET_CLOSED` signals | Cannot label — no market data |
| **Label Source** | `oracle_v2_ohlc` | Distinguishes from future oracle versions |

---

## 9. Expected Outcomes

### 9a. After Oracle Labels Your 1,186 Signal Rows

Based on the OHLC simulation (adjusted for signal timing vs candle timing):

| Label | Expected Count | Expected % |
|---|---|---|
| **0 (BUY CE)** | ~370–420 | ~31–35% |
| **1 (BUY PE)** | ~260–310 | ~22–26% |
| **2 (WAIT)** | ~460–540 | ~39–45% |

> [!NOTE]  
> Signal-row labels will skew slightly more toward WAIT than the pure OHLC simulation because:  
> 1. Some signals fire after 14:45 → forced WAIT  
> 2. Signal timestamps may not perfectly align with candle openings  
> 3. The engine generates more signals during sideways periods

### 9b. What This Enables

| Capability | Without Oracle | With Oracle v2 |
|---|---|---|
| **XGBoost Training** | No labels → Impossible | ✅ 1,186 labeled rows |
| **Engine Accuracy Audit** | Guesswork | ✅ Precise: "14 BUY CE signals, X% correct" |
| **Feature Importance** | Unknown | ✅ Which features predict CE/PE/WAIT? |
| **Missed Opportunity Analysis** | Invisible | ✅ "417 AVOID rows, X% were actually profitable" |
| **Regime Detection** | Manual | ✅ Per-day label distributions show regime |
| **Forward Testing** | Impossible | ✅ Label new signals as OHLC data flows in |

---

## 10. Summary Action Items

| # | Action | Priority | Status |
|---|---|---|---|
| 1 | Build `oracle_labeler_v2.py` | 🔴 Critical | 🟡 Next |
| 2 | JOIN signals → ohlc_candles with nearest-candle matching | 🔴 Critical | — |
| 3 | First-hit detection using `candle.high` and `candle.low` | 🔴 Critical | — |
| 4 | Exclude `MARKET_CLOSED`, handle post-14:45 cutoff | 🟢 Important | — |
| 5 | Update `signals.label` and `signals.label_source` in Supabase | 🔴 Critical | — |
| 6 | Generate validation report (engine accuracy vs Oracle truth) | 🟢 Important | — |
| 7 | Normalize remaining `BUY CALL (CE)` → `BUY CE` in signals | 🟡 Pre-req | 13 rows |
| 8 | Add `sample_weight` based on class frequency to XGBoost config | 🟢 Safety net | — |
| 9 | Schedule Oracle re-labeling whenever ohlc_candles grows | 🟢 Future | n8n automation |

---

> *"v1 Oracle looked at the market through a keyhole — one price point per signal. v2 Oracle has a window — full OHLCV bars showing every spike and dip that happened between signals. The machine finally sees what the market actually did, not what we guessed it did."*
