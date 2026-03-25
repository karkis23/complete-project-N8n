# 16 — The ML Oracle: How We Label Data for XGBoost
*Documented: March 25, 2026*

---

## 1. The "Echo Chamber" Warning (The Wrong Way to Train AI)
Currently, our Supabase database captures the `signal` column (what the hardcoded 25-step Rules Engine decided at that 5-minute tick — e.g., `BUY CE`, `WAIT`, `AVOID`). 

**The Fatal Flaw:** If we train the XGBoost algorithm to predict the `signal` column, we are simply training the AI to perfectly mimic the Rules Engine. We are building an elaborate mathematical clone that will make the exact same mistakes the Rules Engine makes. 

The goal of the ML pipeline is *not* to guess what the Rules Engine thought. The goal is to accurately predict **what the market actually did**.

---

## 2. Training on Reality: The "Forward-Looking Oracle"

To make the AI superior to the Rules Engine, we must label the data based on **Future Market Reality**. 

Because we collect the data historically into Supabase, we possess a mathematical advantage: a "God's eye view" of the market. If we look at a record stored at 10:00 AM, we can "look into the future" (at the rows from 10:05, 10:10, and 10:15) to see what the spot price actually did.

To execute this, we will build an **Oracle Python Script** (e.g., `label_data.py`). Once a week, this script will connect to Supabase, analyze all raw telemetry rows, look forward in time, and permanently assign an objective mathematical `label` (0, 1, or 2) to each row. 

---

## 3. The Labelling Logic (Step-by-Step Mathematics)

The `train_model.py` script specifically expects the `label` column to contain one of three integers for every single 5-minute tick:

*   `0` = Correct action was **BUY CE** (Bullish breakout happened)
*   `1` = Correct action was **BUY PE** (Bearish breakdown happened)
*   `2` = Correct action was **WAIT** (Market chopped, went sideways, or reversed and hit stop-loss)

Here is the exact mathematical logic the Oracle Script will use to assign those numbers:

### Step A: Lock the Anchor Price
The script evaluates **Row A** (e.g., 10:00 AM). 
*   **Anchor Price:** `spot_price` = `22,500`

### Step B: Define Target and Stop-Loss Limits
Before looking forward, we define our strict risk-reward bounds. For example:
*   **Target (Take Profit):** `+25 points`
*   **Maximum Risk (Stop Loss):** `-15 points`
*   **Time Limit:** `60 minutes` (This equals scanning exactly 12 future candle rows)

### Step C: Look Forward in Time & Assign the Label
The script scans the next 12 rows (from 10:05 AM to 11:00 AM) and checks what mathematically happened *first*:

1.  **Scenario A (The CE Win):** Did the spot price hit `22,525` (+25pts) BEFORE it dropped to `22,485` (-15pts SL)? 
    *   **Result:** The market moved up cleanly.
    *   **Oracle Action:** Updates Supabase and sets `label = 0`.
2.  **Scenario B (The PE Win):** Did the spot price drop to `22,475` (-25pts) BEFORE it rose to `22,515` (+15pts SL)?
    *   **Result:** The market crashed cleanly.
    *   **Oracle Action:** Updates Supabase and sets `label = 1`.
3.  **Scenario C (The Losers and Choppy Markets):** 
    *   Did the Stop Loss get hit *before* either target?
    *   Or did 60 minutes pass and the price just wandered sideways without cleanly hitting either 25pt target?
    *   **Result:** It was a terrible, choppy, or dangerous time to trade.
    *   **Oracle Action:** Updates Supabase and sets `label = 2`.

---

## 4. How the Oracle Fixes the Rules Engine's Mistakes

**The Scenario:**
At 10:15 AM, the hardcoded Rules Engine got confused by mixed indicators (e.g., Stochastic was high but Gamma Exposure was dropping). Out of caution, the Rules Engine output `signal = "WAIT"`. 

However, right after 10:15 AM, Institutional buyers stepped in, and the market shot up 40 points in 10 minutes. 

**The Oracle's Correction:**
When the Labelling Script runs over the database on Friday:
1. It ignores the fact that the Rules Engine said "WAIT". 
2. It looks at the price at 10:15 AM, looks at the price at 10:25 AM, and sees that the +25pt mathematical target was hit beautifully.
3. It natively updates that specific row with `label = 0` (BUY CE).

**The Resulting AI Superintelligence:** 
When we eventually run `train_model.py`, the XGBoost algorithm looks at the 57 features (RSI, GEX, Options Flow, MACD) specifically captured at 10:15 AM. It notices that the ultimate label for that exact moment was `0` (Buy CE). 

The AI mathematically figures out the hidden correlations in those 57 features that predicted the breakout—correlations the human-coded rules were too rigid to see. **The AI has now successfully learned to spot a breakout the Rules Engine missed.**

---

## 5. Current State of the Database

If you inspect the `public.signals` schema in Supabase today, you will notice two empty columns precisely sitting at the end of every row:
*   `"label": null`
*   `"label_source": null`

They are sitting dormant, intentionally waiting for Phase 3. 

Once we collect 2-3 weeks of raw 64-column data, our very next phase is executing the `label_data.py` script to automatically back-fill those empty columns using the math described above. Only when those labels are populated based on *Reality* will we unleash the XGBoost algorithm over the dataset.
