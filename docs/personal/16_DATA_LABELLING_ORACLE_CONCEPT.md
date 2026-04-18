# 16 — The ML Oracle: How We Label Data for XGBoost
*Updated: April 18, 2026 (Oracle v2 — OHLC-Powered)*

---

## 0. The Concept in Plain English

In ancient mythology, an Oracle is something that can perfectly see the future.

In Zenith, **"The Oracle"** is a specialized Python script (`label_data.py`). Its only job is to open your Supabase database on the weekends and **judge the past using the power of hindsight.** 

It completely ignores the 57 technical indicators. It simply looks at a past row, looks forward in time at exactly what the price did next, and permanently brands that row with the absolute mathematical truth (`0 = BUY CE`, `1 = BUY PE`, `2 = WAIT`). 

Because The Oracle uses Hindsight to provide perfect answers, the XGBoost AI can passionately study those answers to develop **Foresight.** Because of the Oracle, your AI will learn to spot massive trades that your human-coded rules completely ignored!

---

## 1. The "Echo Chamber" Warning (The Wrong Way to Train AI)
Currently, our Supabase database captures the `signal` column (what the hardcoded 25-step Rules Engine decided at that 5-minute tick — e.g., `BUY CE`, `WAIT`, `AVOID`). 

**The Fatal Flaw:** If we train the XGBoost algorithm to predict the `signal` column, we are simply training the AI to perfectly mimic the Rules Engine. We are building an elaborate mathematical clone that will make the exact same mistakes the Rules Engine makes. 

*Note on Survivorship Bias (Fixed v4.3.0):* Previously, we only logged `BUY CE` and `BUY PE`. Now, we successfully log all `WAIT`, `AVOID`, and `SIDEWAYS` states. This is crucial because it provides the Oracle scripting with the "negative class" dataset—a complete mathematical picture of when *not* to trade, allowing the script to find setups we incorrectly avoided.

The goal of the ML pipeline is *not* to guess what the Rules Engine thought at that moment. The goal is to accurately predict **what the market actually did** using the 64 columns of collected telemetry.

---

## 2. Training on Reality: The "Forward-Looking Oracle"

To make the AI superior to the Rules Engine, we must label the data based on **Future Market Reality**. 

Because we collect the data historically into Supabase, we possess a mathematical advantage: a "God's eye view" of the market. If we look at a record stored at 10:00 AM, we can "look into the future" (at the rows from 10:05, 10:10, and 10:15) to see what the spot price actually did.

To execute this, we will build an **Oracle Python Script** (e.g., `label_data.py`). Once a week, this script will connect to Supabase, analyze all raw telemetry rows, look forward in time, and permanently assign an objective mathematical `label` (0, 1, or 2) to each row. 

---

## 3. The Labelling Logic (Oracle v2 — OHLC-Powered)

> [!IMPORTANT]
> **Major Update (April 2026)**: The Oracle has been upgraded from v1 (signal-based) to v2 (OHLC-based). v2 uses the `ohlc_candles` table with High/Low data for **precise first-hit detection**. See `docs/personal/ohlc_oracle_v2_breakdown.md` for the complete design.

The `train_model.py` script specifically expects the `label` column to contain one of three integers for every single 5-minute tick:

*   `0` = Correct action was **BUY CE** (Bullish breakout happened)
*   `1` = Correct action was **BUY PE** (Bearish breakdown happened)
*   `2` = Correct action was **WAIT** (Market chopped, went sideways, or reversed and hit stop-loss)

### v2 Thresholds (Delta-Adjusted)
Since we trade ATM options with Delta ≈ 0.5, the spot thresholds must account for the delta translation:

| Parameter | Option Premium | NIFTY Spot Move |
|---|---|---|
| **CE Target** | +25 pts | Spot + **50 pts** |
| **CE Stop Loss** | -15 pts | Spot − **30 pts** |
| **PE Target** | +25 pts | Spot − **50 pts** |
| **PE Stop Loss** | -15 pts | Spot + **30 pts** |
| **Time Limit** | — | **60 minutes** (12 candles) |

### Step A: Lock the Anchor Price
The script evaluates **Row A** (e.g., 10:00 AM). It finds the nearest `ohlc_candles` row to the signal timestamp.
*   **Anchor Price:** `candle.close` = `22,500`

### Step B: Walk Forward Through OHLC Candles
The script gets the next 12 candles (60 min) from `ohlc_candles` and checks **High and Low** in time order:

1.  **Scenario A (CE Win):** Does candle HIGH hit `22,550` (+50pts) BEFORE candle LOW drops to `22,470` (-30pts SL)?
    *   **Result:** `label = 0`
2.  **Scenario B (PE Win):** Does candle LOW hit `22,450` (-50pts) BEFORE candle HIGH rises to `22,530` (+30pts SL)?
    *   **Result:** `label = 1`
3.  **Scenario C (WAIT):** SL hit first, or 60 minutes expired without either target.
    *   **Result:** `label = 2`

### Why v2 Uses High/Low Instead of Close
v1 only used `signals.spot_price` (a single close value). This missed intra-bar spikes:
```
Candle: Open=24100, High=24165, Low=24095, Close=24110
v1 sees: 24110 (misses the +65pt spike to 24165)
v2 sees: High=24165 (correctly detects CE target hit)
```

---

## 4. How the Oracle Fixes the Rules Engine's Mistakes

**The Scenario:**
At 10:15 AM, the hardcoded Rules Engine got confused by mixed indicators (e.g., Stochastic was high but Gamma Exposure was dropping). Out of caution, the Rules Engine output `signal = "WAIT"`. 

However, right after 10:15 AM, Institutional buyers stepped in, and the market shot up 40 points in 10 minutes. 

**The Oracle's Correction:**
When the Labelling Script runs over the database on Friday:
1. It ignores the fact that the Rules Engine said "WAIT". 
2. It looks at the price at 10:15 AM, looks at the price at 10:25 AM, and sees that the +35pt mathematical target was hit beautifully.
3. It natively updates that specific row with `label = 0` (BUY CE).

**The Resulting AI Superintelligence:** 
When we eventually run `train_model.py`, the XGBoost algorithm looks at the 57 features (RSI, GEX, Options Flow, MACD) specifically captured at 10:15 AM. It notices that the ultimate label for that exact moment was `0` (Buy CE). 

The AI mathematically figures out the hidden correlations in those 57 features that predicted the breakout—correlations the human-coded rules were too rigid to see. **The AI has now successfully learned to spot a breakout the Rules Engine missed.**

---

## 5. Current State of the Database (April 2026)

Following the v5.1 OHLC-Enhanced upgrade, the system now has **two data sources**:

### Signals Table (`public.signals`)
- **1,306 rows** across 12 active trading days (Mar 24 – Apr 17, 2026)
- Full 64-column feature matrix with 100% sync rate
- `label` and `label_source` columns: **currently NULL** (awaiting Oracle v2 run)

### OHLC Candles Table (`public.ohlc_candles`) — NEW
- **975 candles** across 13 trading days (75 candles/day, exact 5-min intervals)
- Raw High/Low/Open/Close/Volume from Angel One
- **Automatic ingestion** via n8n (parallel to Python AI Engine call)
- **30 days backfilled** via `api/scripts/backfill_ohlc.py`

### Simulated Oracle v2 Label Distribution
Running the Oracle logic against the 975 OHLC candles produces:

| Label | Count | Percentage |
|---|---|---|
| **0 (BUY CE)** | 307 | 37.5% |
| **1 (BUY PE)** | 216 | 26.4% |
| **2 (WAIT)** | 296 | 36.1% |

This is far more balanced than the v1 prediction of ~80% WAIT, due to the extreme volatility of the current market period (avg daily range: 362 pts).

Our next action is executing `oracle_labeler_v2.py` to populate the `label` column using the OHLC first-hit algorithm.

---

## 6. Hindsight vs. Foresight: Why We Collect the 57 Indicators

A common point of confusion is: *"If the Oracle Script only looks at `time` and `spot_price` to assign the label, why do we bother collecting the 57 features (RSI, GEX, PCR) every 5 minutes?"*

The answer lies in the fundamental difference between **Training (Hindsight)** and **Live Trading (Foresight)**.

To train an AI model, you mathematically require two datasets:
1. **The Clues (The 57 Indicators):** What the market looked like at that exact moment.
2. **The Answer Key (The Oracle Label):** What the market actually did next.

### The Detective Analogy

Think of the XGBoost AI model as a **Detective in training**.
Think of the Oracle Script as the **Judge** who already knows the answer.

**During Offline Training (The Weekend):**
* The Detective looks at a snapshot of a crime scene from last Tuesday at 10:00 AM. They look at the 57 clues (RSI was oversold, Gamma Exposure was highly negative, Bollinger Bands were squeezing).
* The Detective makes a guess: *"I think the market crashed."*
* The Detective then checks the Judge's answer key (The Oracle Label). The Judge says: **`LABEL 0: The market actually broke out.`**
* The Detective realizes they were wrong! They mathematically adjust their internal logic trees. They learn that *when* RSI is oversold *and* GEX is highly negative, it actually causes a massive breakout.
* The Detective repeats this process 50,000 times over historical data until they perfectly understand the correlations between the 57 clues and the eventual outcome.

**During Live Trading (Monday Morning):**
* The Detective is now fully trained and deployed to the live market. 
* At 10:00 AM, the Judge (The Oracle) **does not exist.** We cannot look into the future. 
* The Detective ONLY has the 57 clues that were just collected by n8n.
* Because the Detective spent the entire weekend rigorously studying exactly how those 57 clues correlate to reality, they take one look at the live Option Chain and instantly predict: *"I have seen this exact mathematical footprint before. There is an 85% probability of a Bullish Breakout."*

### Conclusion
**The Oracle uses Hindsight (Future Price) to provide the perfect answers.**
**The AI studies those answers against the Features to develop Foresight.**

We physically collect all 57 indicators because they are the absolute mathematical foundation the AI relies on to predict the future when the Oracle is no longer there to protect it.
