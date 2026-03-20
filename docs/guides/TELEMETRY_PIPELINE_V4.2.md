# Deep Telemetry Pipeline v4.2

## Overview
As part of the Zenith v4.2/4.3 upgrade, the `signals` telemetry pipeline was significantly expanded. Because the AI model trains purely on historical data, maximizing the feature set exposed over time improves inference accuracy. 

Previously, the AI engine calculated advanced indicators (like Volume Profile, structural Price Action, and options flow) but failed to export them to the Supabase log. This pipeline upgrade ensures **all 33 critical AI vectors** and **7 metadata tags** are perfectly synced into the `signals` database for both real-time dashboard visualization and future model training.

---

## 🚀 The 4-Layer Pipeline Architecture

Data smoothly flows through four main checkpoints before reaching the database.

### 1. Indicators Module (`api/engine/indicators.py`)
This is the root calculator. Raw 5-minute candles from Angel One are converted into advanced structural metrics.
*   **Volume Profile**: Calculates `POC` (Point of Control).
*   **ATR**: Wilder's smoothed `volatility_atr`.
*   **Price Action**: Assigns a `score` based on swing high/low structural breakouts.

### 2. Rule Engine / Formatter (`api/engine/rule_engine.py`)
This aggregates the indicators and prepares the JSON response.
*   Calculates `session_progress` (elapsed trading minutes / 375).
*   Calculates `poc_distance` (current spot LTP minus the POC).
*   Calculates `market_strength` (0-100 composite index combining ADX, Trend alignment, Volume, and Options flow).
*   Appends all these values into the outgoing `_make_response()` dictionary payload.

### 3. N8N Orchestration Matrix (`n8n/workflows/NEWN8NFINAL_SUPABASE.JSON`)
When n8n hits the API via the **Call Python AI Engine** node, it receives the complete JSON. 
*   The **Log Signal to Supabase** node explicitly maps these fields.
*   *Workflow Mapping Example:* `{{ $json.Price_action_score }}` maps directly to the `price_action_score` SQL column.

### 4. Supabase Database (`n8n/supabase_schema.sql`)
The final storage layer. The schema was successfully altered to include text/metadata fields securely without causing breaking changes.

---

## 🛡️ Protecting the XGBoost Model

While adding rows to `signals` is great for logging, **it creates a dangerous side effect for Model Training.**

XGBoost requires purely numeric float fields. If a user exports the new `signals` table to a CSV, it will now contain text like `"MARKET_CLOSED"`, `"AI_ENSEMBLE"`, and `"OPENING_DRIVE"`.

**The Fix:**
The `api/scripts/train_model.py` script was updated to feature a strict `ignore_cols` set:
```python
ignore_cols = {
    "label", "timestamp", "date", "sessionDate", "id", "created_at",
    "signal", "reason", "regime", "raw_signal", "rawSignal", "macd_flip",
    "blocked_reason", "engine_version", "engine_mode", "ai_insights",
    "super_trend", "LastFireTime", "LastSignal", "IV_skew_bias",
    "GEX_Regime", "sentiment", "writers_zone", "candle_pattern", "PA_Type", "MACD_status"
}
```
This guarantees the Pandas data loader intelligently filters out all metadata and prevents `ValueError: could not convert string to float` crashes during the `fit()` progression.

---

## 📊 Complete Field Glossary (Newly Added)

| Field | Type | Layer Origin | Description |
|-------|------|--------------|-------------|
| `market_strength` | `NUMERIC` | Rule Engine | 0-100 weighted index score assessing trend health and volume alignment. |
| `poc_distance` | `NUMERIC` | Rule Engine | Distance (in points) from the current NIFTY Spot to the Volume Profile Point of Control. |
| `volatility_atr` | `NUMERIC` | Indicators | Smoothed Average True Range, mapping pure volatility ranges for stop losses. |
| `session_progress` | `NUMERIC` | Rule Engine | Percentage representation (0-100%) of how far along the Indian trading day is. |
| `engine_mode` | `TEXT` | Signal Engine | `"AI_ENSEMBLE"` or `"RULES_FALLBACK"`. Important for evaluating AI vs fallback accuracy. |
| `Price_action_score` | `NUMERIC` | Indicators | Structural bias score (-2 to +2). |
| `macd` | `NUMERIC` | Indicators | The specific raw MACD histogram value at time of inference. |
| `LastFireTime` | `TEXT` | Memory State | Iso-formatted time string of the last valid signal execution. |
| `IV_skew_bias` | `TEXT` | Writers Zone | Options chain sentiment derived from Implied Volatility discrepancies. | 
| `GEX_Regime` | `TEXT` | Writers Zone | Gamma Exposure regime (`LONG_GAMMA`, `SHORT_GAMMA`, `UNKNOWN`). |
| `Gamma_Flip_Level`| `NUMERIC`| Writers Zone | The strike price at which market makers flip from long to short gamma. |
