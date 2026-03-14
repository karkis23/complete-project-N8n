# 01 — Project Overview: What is Zenith Intelligence?
*Discussed: March 2026*

---

## What is this project in one sentence?

Zenith is a fully automated AI-powered trading system for NIFTY 50 Options that reads the live market every 5 minutes, analyzes 57 unique data points, and executes trades without any human emotion or guesswork.

---

## The Three-Part System

### Part 1: The Data Runner (n8n)
n8n is an automation tool that acts as the "messenger" of the system.

Every 5 minutes during market hours (9:15 AM to 3:30 PM IST), n8n collects live data from three sources:
- **Angel One API** → NIFTY 5-minute candle data (Open, High, Low, Close, Volume)
- **TradingView** → India VIX (Volatility Index)
- **Dhan API** → Live Options Chain (Call/Put OI, Premium, Strike Prices)

n8n bundles this raw data into a JSON packet and sends it via HTTP to the Python Brain.

n8n does NOT make any trading decisions. It is purely a data messenger.

### Part 2: The Brain (Python AI Engine)
This is where all the intelligence lives. It is a FastAPI microservice running on localhost:8000.

When n8n sends the raw data, the Python engine does the following:
1. **Validates the data** (models.py) — ensures nothing is missing or corrupted.
2. **Calculates 57 indicators** (indicators.py + writers_zone.py) — technical math AND options chain intelligence.
3. **Converts everything to numbers** (preprocessor.py) — AI can only read numbers, not words like "Bullish" or "Bearish."
4. **Makes a decision** (signal_engine.py) — either uses the trained AI model or falls back to the 25-step rules engine.
5. **Returns the signal** — a JSON response with the final signal (BUY CE / BUY PE / WAIT), the confidence score (0–100%), and the reasoning.

### Part 3: The Executor (Dhan API via n8n)
n8n receives the signal response from the Python engine. If the signal is BUY CE or BUY PE with sufficient confidence, n8n calls the Dhan broker API to place the options order automatically.

---

## The Software Architecture

```
Angel One ─────┐
TradingView ───┤──► n8n (Data Messenger) ──► Python AI Engine ──► Dhan (Trade Execution)
Dhan OC ───────┘                                    │
                                                    ▼
                                             Google Sheets (Data Log)
                                                    │
                                                    ▼
                                          React Dashboard (Live Monitoring)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Automation | n8n Cloud |
| AI Engine | Python 3.12 + FastAPI |
| Machine Learning | XGBoost Classifier |
| Math/Indicators | Pandas + NumPy |
| Frontend Dashboard | React + Vite + TypeScript |
| Broker (Orders) | Dhan API |
| Broker (Data) | Angel One SmartAPI |
| Data Logging | Google Sheets |
| Version Control | GitHub |

---

## Current Mode: RULES_FALLBACK
The Python engine currently runs in RULES_FALLBACK mode. This means it uses the 25-step hardcoded rules engine (rule_engine.py) which is a perfect Python replica of the original n8n JavaScript logic. The XGBoost AI model has not been trained yet and is dormant, waiting for enough data to be collected.
