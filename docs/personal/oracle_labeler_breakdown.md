# 🔮 Oracle Labeler — Complete Design Breakdown

> **Context**: Building the Oracle labeling script for Zenith's 1,221-row Supabase dataset.  
> **Trading Setup**: ATM NIFTY Options | Target: +25pts | SL: −15pts | Delta ≈ 0.5

---

## 1. The Delta Translation Problem

Your insight is absolutely correct and critical. Let me nail down the math precisely:

### Your R:R in **Option Premium** Space
| Parameter | Option Premium (pts) |
|---|---|
| **Target** | +25 pts |
| **Stop Loss** | −15 pts |
| **R:R Ratio** | 25:15 = **1.67:1** |

### Translation to **NIFTY Spot** Space (via Delta ≈ 0.5)

Since you're logging **NIFTY spot price** (`spot_price` column), but trading **ATM options** with Delta ≈ 0.5:

```
Option Premium Move = Spot Move × Delta

∴ Spot Move = Option Premium Move / Delta
```

| Metric | Option Premium | → NIFTY Spot Equivalent |
|---|---|---|
| **Target Hit** | +25 pts | +25 / 0.5 = **+50 pts** |
| **Stop Loss Hit** | −15 pts | −15 / 0.5 = **−30 pts** |

> [!IMPORTANT]
> The Oracle must label based on **NIFTY spot movement** of **±50 pts for target** and **±30 pts for SL**, NOT the ±25/±15 option premium values. This is because `spot_price` is what we log, not option LTP.

### For CE (Call) Signal:
- **WIN (Label 0)**: Spot rose +50 pts within window → ATM CE premium gained ~25 pts ✅
- **LOSS**: Spot fell −30 pts within window → ATM CE premium lost ~15 pts (SL hit) ❌

### For PE (Put) Signal:
- **WIN (Label 1)**: Spot fell −50 pts within window → ATM PE premium gained ~25 pts ✅
- **LOSS**: Spot rose +30 pts within window → ATM PE premium lost ~15 pts (SL hit) ❌

---

## 2. Your Live Data Reality Check

I queried your actual Supabase database. Here's what we're working with:

### 2a. Signal Distribution (The Imbalance Problem)

| Signal | Count | Percentage |
|---|---|---|
| **WAIT** | 591 | 48.40% |
| **AVOID** | 417 | 34.15% |
| **MARKET_CLOSED** | 110 | 9.01% |
| **SIDEWAYS** | 86 | 7.04% |
| **BUY CALL (CE)** | 13 | 1.06% |
| **BUY PUT (PE)** | 4 | 0.33% |
| **Total** | **1,221** | 100% |

> [!CAUTION]
> **Massive Class Imbalance**: Only **17 out of 1,221 rows** (1.39%) are actual BUY signals. The remaining 98.61% are non-actionable. If the Oracle naively labels the data, expect **~95%+ WAIT labels** → the XGBoost model will learn to always predict WAIT and achieve "high accuracy" while being completely useless.

### 2b. Spot Price Movement Analysis (From Your Database)

| Date | Day Range (pts) | Avg 5m Move | Max 5m Move | BUY Signals |
|---|---|---|---|---|
| 2026-04-16 | **220.45** | 15.59 | 59.55 | 3 |
| 2026-04-15 | **78.05** | 10.35 | 33.85 | 2 |
| 2026-04-13 | **267.65** | 13.17 | 66.30 | 2 |
| 2026-04-10 | **107.95** | 15.96 | 91.15 | 4 |
| 2026-04-09 | **186.05** | 14.38 | 50.45 | 2 |
| 2026-04-08 | **141.50** | 15.00 | 48.90 | 4 |

**Key observations:**
- Average daily range = **~150–220 pts** → A 50-point target move is achievable (about 25–35% of daily range)
- Average 5-minute move = **~14 pts** → So it takes roughly 3–4 candles of directional momentum to hit target
- On low-range days (78 pts on Apr 15), a 50-pt move consumes 64% of the entire day's range → WAIT labels will dominate those days

---

## 3. The Labeling Protocol (Corrected for Delta)

### 3a. Oracle Logic for EVERY Row (Not Just BUY Signals)

> [!IMPORTANT]
> The Oracle labels every single row — **regardless of what the engine signaled**. The engine's signal is a feature, not the label. The label is what the market *actually did*.

```python
# Oracle Labeling Logic (Delta-Adjusted)
TARGET_SPOT_MOVE = 50   # pts in NIFTY spot (= 25 pts option premium @ Δ=0.5)
SL_SPOT_MOVE = 30       # pts in NIFTY spot (= 15 pts option premium @ Δ=0.5)
LOOKAHEAD_WINDOW = 60   # minutes (12 candles at 5-min interval)

for each row at time T₀:
    spot_at_T0 = row.spot_price
    
    # Get next 12 candles from database
    future_rows = get_rows_within(T₀, T₀ + 60min)
    
    # Track which threshold is hit FIRST
    ce_target = spot_at_T0 + TARGET_SPOT_MOVE   # +50
    ce_sl     = spot_at_T0 - SL_SPOT_MOVE       # -30
    pe_target = spot_at_T0 - TARGET_SPOT_MOVE   # -50
    pe_sl     = spot_at_T0 + SL_SPOT_MOVE       # +30
    
    max_spot = max(future_spots)
    min_spot = min(future_spots)
    
    # --- CE Win Check ---
    if max_spot >= ce_target AND min_spot > ce_sl:
        label = 0  # BUY CE was correct
    
    # --- PE Win Check ---
    elif min_spot <= pe_target AND max_spot < pe_sl:
        label = 1  # BUY PE was correct
    
    # --- Both or Neither ---
    else:
        label = 2  # WAIT was correct
```

### 3b. Why "First Hit" Matters

The naive `max/min` check above has a flaw: what if spot goes +50 **but also** −30 within the same 60 minutes? We need to check **which threshold was breached first**:

```python
# Correct: Time-ordered first-hit detection
for future_row in future_rows_ordered_by_time:
    spot = future_row.spot_price
    
    if spot >= ce_target:
        label = 0  # CE target hit first
        break
    elif spot <= pe_target:
        label = 1  # PE target hit first  
        break
    elif spot <= ce_sl:  # If checking for CE, SL hit
        label = 2  # SL killed CE trade
        break
    elif spot >= pe_sl:  # If checking for PE, SL hit
        label = 2  # SL killed PE trade
        break
else:
    label = 2  # Window expired, no threshold hit
```

> [!WARNING]
> There's a subtlety here: the SL check for CE (`spot <= ce_sl = spot_at_T0 − 30`) and the target hit for PE (`spot <= pe_target = spot_at_T0 − 50`) are in the **same direction**. The SL for CE would trigger before PE target. You need to decide: is the Oracle labeling from a "direction-neutral" perspective, or from a per-trade perspective? **Recommendation**: Label direction-neutral (which direction hit its target first).

---

## 4. The Class Imbalance — The Real Danger

### 4a. Expected Label Distribution (Estimated)

Based on your data patterns (avg daily range ~150pts, 50-pt target requirement):

| Label | Meaning | Estimated % | Estimated Count (of 1,221) |
|---|---|---|---|
| **0 (CE)** | Spot rose 50+ pts in 60m | ~8–12% | ~100–150 |
| **1 (PE)** | Spot fell 50+ pts in 60m | ~8–12% | ~100–150 |
| **2 (WAIT)** | Neither target hit | **~76–84%** | ~920–1020 |

> [!NOTE]
> Your concern is valid — WAIT will dominate. However, the imbalance is **nowhere near as extreme** as the signal distribution (98.6% non-BUY) because the Oracle labels **market reality**, not engine predictions. A 50-point move in 60 minutes is actually quite achievable on trending days.

### 4b. Why This Imbalance Still Matters

If you feed 80% WAIT labels to XGBoost:
- The model learns that **always predicting WAIT gives 80% accuracy**
- It becomes a "lazy classifier" — technically accurate, practically useless
- Your CE/PE precision drops to near zero

### 4c. Anti-Imbalance Strategies (Ranked by Priority)

| Strategy | How | Difficulty |
|---|---|---|
| **1. `scale_pos_weight`** | Set in XGBoost: `scale_pos_weight = count_wait / count_minority`. Gives more weight to CE/PE samples during training | Easy ✅ |
| **2. Class Weights** | Manually compute: `{0: 5.0, 1: 5.0, 2: 1.0}` in `sample_weight` parameter | Easy ✅ |
| **3. SMOTE Oversampling** | Synthetically generate new CE/PE rows using nearest-neighbor interpolation | Medium |
| **4. Undersample WAIT** | Randomly drop WAIT rows to match CE/PE count (~150 each → 450 total) | Easy but loses data |
| **5. Hybrid** | Undersample WAIT to 2x minority + SMOTE minority to match → ~300 each = 900 rows | Best ✅✅ |

**Recommended: Strategy 5 (Hybrid)**
```python
from imblearn.combine import SMOTETomek
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline

# CE ~120, PE ~120, WAIT ~980
resampler = Pipeline([
    ('under', RandomUnderSampler(sampling_strategy={2: 300})),  # WAIT: 980 → 300
    ('over', SMOTE(sampling_strategy={0: 300, 1: 300})),        # CE/PE: 120 → 300
])
X_balanced, y_balanced = resampler.fit_resample(X, y)
# Result: 300 CE + 300 PE + 300 WAIT = 900 balanced samples
```

---

## 5. Additional Design Decisions

### 5a. What About MARKET_CLOSED / AVOID / SIDEWAYS rows?

These 613 rows (50.2% of your data) should be **EXCLUDED from Oracle labeling**:

| Signal | Action | Reason |
|---|---|---|
| `MARKET_CLOSED` (110) | **Exclude** | No trading possible, no future data |
| `AVOID` (417) | **Include** | Market was open — the Oracle should check if a trade *could* have worked |
| `SIDEWAYS` (86) | **Include** | Same — check reality |
| `WAIT` (591) | **Include** | Core training data |
| `BUY CE` / `BUY PE` (17) | **Include** | Critical validation rows |

> [!TIP]
> AVOID rows are gold. The engine said "don't trade" — but did the market actually move 50 points? If it did, those are **false negatives** the AI needs to learn from.

### 5b. The Lookahead Window Problem

Your data captures roughly 1 row every **5–8 minutes** (not exactly 5min due to variable n8n triggers). So 12 rows ≈ 60–96 minutes.

**Recommendation**: Use **timestamp-based windowing**, not row-count:
```python
# ✅ Correct: Time-based
future_rows = signals.filter(
    timestamp__gt=T0, 
    timestamp__lte=T0 + timedelta(minutes=60),
    session_date=current_session
)

# ❌ Wrong: Row-count based (unreliable intervals)
future_rows = signals[i+1 : i+13]
```

### 5c. End-of-Day Edge Case

Signals fired after **2:45 PM IST** (Sep 15:15 - 30 min buffer) won't have 60 minutes of future data. Options:
1. **Exclude** rows after 2:45 PM from labeling
2. **Use shorter window** with adjusted thresholds
3. **Label as WAIT** (conservative — they lack sufficient lookahead)

**Recommendation**: Option 1 — exclude. Clean data > more data.

---

## 6. The Corrected Previous Spec

Your existing documentation had conflicting Oracle specs:

| Document | CE Win Condition | PE Win Condition | Window |
|---|---|---|---|
| `STRATEGIC_ROADMAP_v4.3.1.md` | Spot +40 pts AND Low > LTP−15 | Spot −40 pts AND High < LTP+15 | 60 min |
| `04_DATA_COLLECTION_PLAN.md` | Spot +25 pts | Spot −25 pts | 60 min |
| **Correct (Delta-Adjusted)** | **Spot +50 pts** | **Spot −50 pts** | **60 min** |

> [!WARNING]
> Both previous specs were wrong because they didn't account for the Delta ≈ 0.5 translation. The Data Collection Plan used raw option premium values (±25) as if they were spot values. The Roadmap used ±40 which was closer but still arbitrary.

### ✅ The Definitive Oracle Spec

| Parameter | Value | Derivation |
|---|---|---|
| **CE Target** | Spot + **50 pts** | 25 premium pts / 0.5 delta |
| **CE Stop Loss** | Spot − **30 pts** | 15 premium pts / 0.5 delta |
| **PE Target** | Spot − **50 pts** | 25 premium pts / 0.5 delta |
| **PE Stop Loss** | Spot + **30 pts** | 15 premium pts / 0.5 delta |
| **Window** | **60 minutes** | 12 candles |
| **Label 0** | CE target hit first | Spot rose ≥50 before falling ≥30 |
| **Label 1** | PE target hit first | Spot fell ≥50 before rising ≥30 |
| **Label 2** | Neither/SL/Expiry | Default |

---

## 7. Summary Action Items

| # | Action | Priority |
|---|---|---|
| 1 | Normalize legacy signals (`BUY CALL (CE)` → `BUY CE`) in database | 🟡 Pre-req |
| 2 | Build `oracle_labeler.py` with **Delta-adjusted** thresholds (±50/±30 spot) | 🔴 Critical |
| 3 | Use **timestamp-based** 60-min window, not row-count | 🔴 Critical |
| 4 | Exclude `MARKET_CLOSED` rows and post-2:45 PM rows | 🟢 Important |
| 5 | After labeling, audit distribution: expect ~10–15% CE, ~10–15% PE, ~70–80% WAIT | 🟢 Validation |
| 6 | Implement **Hybrid resampling** (undersample WAIT + SMOTE CE/PE) before training | 🔴 Critical |
| 7 | Use XGBoost `scale_pos_weight` or custom `sample_weight` as additional guard | 🟢 Safety net |
| 8 | Update all project documentation with corrected ±50/±30 spec | 🟡 Housekeeping |

---

> *"The Oracle doesn't predict the future — it audits the past with perfect hindsight, and hands that truth to the machine so it can learn to predict the future."*
