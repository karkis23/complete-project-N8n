# 04 — Data Collection Plan: How We Train the AI
*Updated: April 2026*

---

## The Core Concept: Teaching the AI Requires Labeled Data

An AI cannot learn from raw market data alone. It needs to know not just what the market looked like (the 64 telemetry points), but also what ACTUALLY happened after (did the market go up or down in the next 60 minutes?). This pairing is called "labeled data."

---

## Step 1: Collect Raw Data (Current Phase: Data Incubation)
The **Supabase v5.0** `signals` table is logging every 5-minute market snapshot. Each row contains:
- **64 Telemetry Columns** (Price, RSI, MACD, deep GEX, IV Skew, Stochastic, etc.)
- What the Rule Engine predicted (WAIT, AVOID, etc.)
- Metadata and Timestamps

**Target:** 1,500 to 2,000 rows minimum for initial training.
- **Current Progress:** ~460 high-fidelity rows banked across 6 active trading days.
- **Estimated Completion:** ~3 to 4 more weeks of steady market sessions.

### Data Volume Hierarchy
| Level | Rows | Time | Reliability | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Minimum** | 1,500 - 2,000 | 1 Month | Medium | Basic trend detection |
| **Better** | 5,000 | 4 Months | High | Strong regime detection (Recommended) |
| **Professional** | 10,000+ | 8+ Months | Excellent | Veteran-level patterns & fakeout detection |

**Critical Reminder:** Do NOT modify the Python Engine's output structure during this phase. If you add a new feature midway, earlier rows will have a "hole" in that column, which breaks the consistency required for XGBoost training.

---

## Step 2: The ML Oracle (Look-Ahead Labeling)

The Rule Engine's signal (BUY CE, BUY PE, WAIT) is NOT the label we train on. It is just a guess. The training label must be the **ACTUAL TRUTH** of what the market did.

The Oracle script (`label_data.py`) will eventually work like this:

1. Connects to the Supabase database.
2. Selects a snapshot (e.g., 10:15 AM, NIFTY at 22,000).
3. Scans the next 12 rows (i.e., 60 minutes into the future).
4. **Checks:** Did NIFTY hit 22,025 (= +25 points target) first?
   - **YES** → Labels row as `0` (BUY CE was correct)
5. **Checks:** Did NIFTY hit 21,975 (= -25 points target) first?
   - **YES** → Labels row as `1` (BUY PE was correct)
6. **If neither or Stop-Loss hit first** → Labels row as `2` (WAIT was correct)

This process converts your raw historical telemetry into a perfect training set.

---

## Step 3: Run the Training Script

Once the `label` column is populated in Supabase, we export the data to CSV and run:
```powershell
python scripts/train_model.py --data signals_export.csv
```

The training script will:
1. Load the data and extract the **57 numeric features** from the 64 raw columns.
2. Split the data 80/20 for training and validation.
3. Balance the dataset (upweighting CE/PE signals vs the more common WAIT/AVOID signals).
4. Train the XGBoost classifier.
5. Save the artifacts to `api/models/`:
   - `signal_xgb_v1.pkl` (The AI Brain)
   - `feature_scaler.pkl` (Normalizer)

---

## Step 4: Full AI Activation

The next time the Python server starts, it detects the `.pkl` file and switches from `RULES_FALLBACK` to **AI_ENSEMBLE** mode automatically. No n8n structural changes are required; the system will natively use the AI to predict the `signals` output.

---

## The Labeling Logic (Summary)

| Outcome within 60 mins | Label | Meaning |
|------------------------|-------|---------|
| NIFTY rose +25 points | `0` | BUY CALL (CE) was correct |
| NIFTY fell -25 points | `1` | BUY PUT (PE) was correct |
| Neither happened | `2` | WAIT was correct |

---

## Current Professional Status
We have successfully migrated from the limited Google Sheets logging to the high-frequency **Supabase v5.0** 64-column scheme. The "Data Incubation Phase" is in its sixth active day. All telemetry is 100% accurate, with 0 missing datapoints. We are now simply waiting for the row count to reach the 1,500 threshold.

>*"The engine is perfected. The database is trapping the light. We are simply letting the fuel tank fill."*

