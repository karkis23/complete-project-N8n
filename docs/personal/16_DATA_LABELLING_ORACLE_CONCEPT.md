# 16 — The ML Oracle: How We Label Data for XGBoost
*Updated: March 26, 2026 (v4.3.0 Data Incubation Phase)*

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

## 5. Current State of the Database (Data Incubation Phase)

Following the v4.3.0 Live Database Audit, the `public.signals` table in Supabase is successfully ingesting the full 64-column feature matrix with 100% sync rate (0 missing metrics across GEX, PCR, IV Skew, etc.).

However, if you inspect the schema today, you will notice the target columns sitting at the end of every row:
*   `"label": null`
*   `"label_source": null`

They are sitting dormant, intentionally waiting for Phase 3. 

We are currently in the **Data Incubation Phase**. The system flawlessly logs ~75 live market snapshots daily. Once we collect 2-3 weeks of raw 64-column data, our very next action is executing the `label_data.py` script to automatically back-fill those empty columns using the forward-looking math described above. 

Only when those labels are populated based on *Absolute Market Reality* will the `ml_training_export` SQL View be passed into the XGBoost training algorithm.

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
