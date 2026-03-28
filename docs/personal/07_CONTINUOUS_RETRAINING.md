# 07 — Continuous Retraining: Keeping the AI Sharp Over Time
*Updated: March 2026 (v4.3.0 Supabase & GPU Architecture)*

---

## 1. The Market Never Stays the Same
What works in March (trending, high ADX) might fail in June (slow summer chop). AI models "drift" over time if they are never updated. A model trained purely on March data might underperform by August because the overall market regime has changed.

The solution is **Continuous Retraining** — a regular weekend refresh cycle that keeps the AI adapted to current conditions.

---

## 2. The Danger of Incremental Learning ("Catastrophic Forgetting")

A common question is: *"Can we just train the AI on this exact week's data to update it? Do we really need to retrain the entire database from scratch?"*

**Yes. You must train the entire database from scratch every single time.**

If you only train the AI on the new data from *this* week, the AI will heavily bias itself toward whatever just happened. In Machine Learning, this is called **"Catastrophic Forgetting."** 
For example, if this week was a boring, sideways market, the AI might aggressively overwrite its own internal rules to survive sideways chop. When Monday opens with a massive 500-point VIX crash identical to one that happened 3 months ago, the AI will fail—because it "forgot" the math from 3 months ago.

By feeding it the **entire** historical database every weekend, the XGBoost trees mathematically balance *everything*—the weird crash from 6 months ago, the sideways chop from 2 months ago, and the momentum breakout from last Thursday.

---

## 3. The GPU Advantage (Speed is Free)

Because you have highly compressed numeric data (57 integer features) and **NVIDIA GPU Acceleration (`device="cuda"`) enabled**, training your entire database from scratch is practically free. 

Even if you aggregate an enormous 500,000 rows of live Supabase data over the next two years, your GPU will blast through the *entire* mathematical matrix and build all 50,000 XGBoost trees in under 60 seconds! There is zero computational penalty for training the whole database.

---

## 4. The 5-Step Weekend Ritual

Here is the exact CI/CD (Continuous Integration) workflow for upgrading your AI's brain over the weekend:

### Step 1: The Oracle Run (Friday Evening)
* When the market closes, run the `label_data.py` Python script. 
* The script connects to Supabase, finds all the unlabelled data from Monday to Friday, and mathematically calculates if those rows should be branded `0 (CE)`, `1 (PE)`, or `2 (WAIT)` based on your -15/+35 targets.

### Step 2: The Extraction (Saturday Morning)
* Log into your Supabase dashboard and go to your `ml_training_export` SQL View.
* Click **Export to CSV**. 
* Save it locally as `training_YYYYMMDD.csv` so you keep an archive.

### Step 3: The GPU Training Run (Saturday Afternoon)
* Open your terminal in the Zenith project folder.
* Run: `python api/scripts/train_model.py --data training_YYYYMMDD.csv`
* Your NVIDIA CUDA cores spin up. The XGBoost algorithm loads the CSV and performs the Extreme Gradient Boosting loop.
* *Result:* It generates a brand new `signal_xgb_v1.pkl` (The Brain) and a `training_report.json` (The Report Card).

### Step 4: The Validation Gate (The Human Check)
Before deploying the new brain on live money, read the `training_report.json` Confusion Matrix. 
* Did the AI achieve an acceptable win rate on directional breakouts? 
* If *yes*, the new model is a mathematical success.
* If *no* (maybe the week was extremely weird and noisy), **abort the upgrade**. You keep using last week's model until next Friday. *Never deploy a downgraded model.*

### Step 5: The Hot Swap Deployment (Sunday)
* If the new model passes, drag the new `signal_xgb_v1.pkl` file into your `api/engine/models/` directory, overwriting the old one.
* Reboot your FastAPI server (`uvicorn main:app`).
* When n8n fires at 9:20 AM on Monday, it will be talking to an updated AI that mathematically remembers every single mistake it made last week!
