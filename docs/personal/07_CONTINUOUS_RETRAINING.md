# 07 — Continuous Retraining: Keeping the AI Sharp Over Time
*Discussed: March 2026*

---

## The Market Never Stays the Same

What works in March (trending, high ADX) might fail in June (slow summer chop). AI models "drift" over time if they are never updated. A model trained purely on 2026 March data might underperform by August 2026 because the market structure has changed.

The solution is **Continuous Retraining** — a regular refresh cycle that keeps the AI adapted to the current market.

---

## The Training Lifecycle

### Version 1.0 (First Training — April/May 2026)
- 1,500–2,000 rows collected
- First training on the entire dataset
- AI goes live for the first time

### Version 1.1 (2–3 weeks after going live)
- Google Sheet now has 2,500 rows (it kept logging while AI was trading)
- Retrain with the expanded dataset
- More diverse data → better patterns found → accuracy improves

### Version 1.2, 1.3, ... (Monthly or when accuracy dips)
- Each retrain includes all historical data plus new recent data
- The model gets a cumulative education — it never "forgets" old lessons

---

## The Weekend Retrain Ritual (Recommended)

Every Saturday morning, follow these simple steps:

**Step 1:** Open your Google Sheet → File → Download → CSV
**Step 2:** Save as `training_YYYYMMDD.csv` (date in filename for tracking)
**Step 3:** Open PowerShell, navigate to `api/`, activate the virtual environment
**Step 4:** Run the Look-Ahead Labeler on new rows
**Step 5:** Run `python scripts/train_model.py --data training_YYYYMMDD.csv`
**Step 6:** Training completes in ~60 seconds on your laptop
**Step 7:** New `signal_xgb_v1.pkl` is automatically generated and replaces the old one
**Step 8:** Restart the server on Monday morning

No changes to n8n. No changes to the React dashboard. The upgraded brain is silently installed.

---

## How XGBoost Handles New Data

XGBoost does a full retrain each time (not incremental). This is actually an advantage — it re-analyzes ALL the data from scratch with fresh eyes. It doesn't build on old biases; it discovers the best patterns from the entire historical dataset every retrain.

A retrain on 5,000 rows of data (about 4 months of market data) typically takes:
- ~45 seconds on a standard i5 laptop
- ~15 seconds on an i7 or Ryzen 7
- ~5 seconds if you add a GPU (future upgrade option)

---

## Versioning Your Models (Best Practice)

Instead of overwriting the same `signal_xgb_v1.pkl` file every time, consider maintaining a version history:

```
api/models/
  signal_xgb_v1.pkl     ← Active model (always this name)
  archive/
    signal_xgb_2026_03.pkl
    signal_xgb_2026_04.pkl
    signal_xgb_2026_05.pkl
```

If a new version performs badly in live trading, you can immediately roll back by copying an archived version back to `signal_xgb_v1.pkl` and restarting the server.

---

## Signs That It Is Time to Retrain

1. Win rate drops below 55% over 2+ consecutive weeks
2. The AI starts making the same type of mistake repeatedly (e.g., always getting faked by morning gap-opens)
3. New market conditions emerge that weren't in the original training data (e.g., extreme Budget day volatility)
4. You have collected 500+ new rows since the last training
