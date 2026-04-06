# 22 — AI Model Output Consistency (Database Fields Guide)
*Created: April 05, 2026 — Documenting the relationship between AI Predictions and Database Schemas*

---

## 🔍 The Core Question
**"After training our AI model, will it still provide the same output required fields in the Supabase database?"**

The answer is a definitive **YES**. The system is architected to ensure that your data pipeline remains consistent, regardless of whether the "Brain" making the decision is a set of math rules or a trained XGBoost model.

---

## 🏗️ 1. The Dual-Brain Architecture
Zenith uses a "Two-Brian" fallback system designed for stability. Both brains are housed inside the same execution pipeline:

1.  **Rule Engine (v3.0 Logic):** Uses 25+ hardcoded steps to calculate a signal.
2.  **AI Engine (v4.0 XGBoost):** Uses 57+ features to predict a signal probability.

**Key Insight:** Both engines share the same **Output Formatter** (`_make_response`). This function is the "gatekeeper" that ensures every single signal—no matter who generated it—contains the full 64-column telemetry required by your Supabase schema.

---

## 📊 2. What Stays the Same?
Even when the AI model is active and "Live," the following 64 fields are still calculated and sent to your `signals` table every 5 minutes:

| Category | Fields | Status After AI Training |
|----------|--------|--------------------------|
| **Core Indicators** | RSI, ADX, MACD, EMA20, SMA50 | **No Change** (Calculated & Stored) |
| **Institutional** | GEX, IV Skew, Max Pain, PCR | **No Change** (Calculated & Stored) |
| **Volatility** | VIX, ATR, BB Width | **No Change** (Calculated & Stored) |
| **Logic Flags** | SuperTrend Validated, Streak Count | **No Change** (Calculated & Stored) |
| **Time Meta** | Session Progress, Opening Drive | **No Change** (Calculated & Stored) |

---

## 🔄 3. What Actually Changes?
When you switch from the Rule Engine to the AI Model, only the *values* within specific "Inference Columns" change:

*   **`engine_mode`**: Updates from `RULES_FALLBACK` to `AI_ENSEMBLE`.
*   **`confidence`**: Instead of a rule-based score (0-100), this becomes the AI's actual statistical probability of success.
*   **`ai_insights`**: This field becomes highly dynamic, listing the top 5 features the AI used to determine the signal (e.g., *"AI Key Feature: GEX=0.85 (importance=0.12)"*).
*   **`reason`**: Changes to reflect the AI's decision (e.g., *"AI Model: BUY CALL (CE) (82.1% confidence)"*).

---

## 🧠 4. Why This Persistence is Critical
We don't "turn off" the database fields just because the AI is smart. We keep them for three vital reasons:

1.  **Future Training (Data Incubation):** To train "AI v2.0" in the future, you need the historical record of what the RSI/VIX was while "AI v1.0" was trading.
2.  **Explainable AI (XAI):** On your `XAIPage.tsx`, you need to see the raw indicators (the "Why") behind every AI prediction.
3.  **Human Audit:** If a trade fails, you need to look at the database to see if it was a data error (LTP=0) or a model error (Confidence was high but indicators were weak).

---

## 💡 Summary for the Trader
> **"The AI is a different way of looking at the same data. The data itself—and how it is stored in your database—never changes. This ensures your system is stable, scalable, and ready for long-term quantitative success."**

---
*Documented on: April 05, 2026 | Architecture: v4.3.0 | Status: Data Consistency Verified*
