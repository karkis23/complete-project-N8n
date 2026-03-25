# 01 — Project Overview: What is Zenith Intelligence?
*Discussed: March 2026*

---

## What is this project in one sentence?

Zenith is a fully automated AI-powered trading system for NIFTY 50 Options that reads the live market every 5 minutes, analyzes 57 numeric ML features derived from 64 unique data points, and executes trades without any human emotion or guesswork.

---

## The Three-Part System

### Part 1: The Data Runner (n8n)
n8n is an automation tool that acts as the "messenger" and orchestrator of the system.

Every 5 minutes during market hours (9:15 AM to 3:30 PM IST), n8n collects live data from three sources:
- **Angel One API** → NIFTY 5-minute candle data (Open, High, Low, Close, Volume)
- **TradingView** → India VIX (Volatility Index)
- **Dhan API** → Live Options Chain (Call/Put OI, Premium, Strike Prices)

n8n bundles this raw data into a JSON packet and sends it via HTTP to the Python Brain. Crucially, before applying any trade filters, n8n logs **all** signals (including WAIT/SIDEWAYS) into the Supabase ML Feature Store to prevent survivorship bias during AI training.

n8n does NOT make any trading decisions. It is purely a data messenger.

### Part 2: The Brain (Python AI Engine)
This is where all the intelligence lives. It is a FastAPI microservice running on localhost:8000.

When n8n sends the raw data, the Python engine does the following:
1. **Validates the data** (`models.py`) — ensures nothing is missing or corrupted.
2. **Calculates 64 telemetry fields** (`indicators.py` + `writers_zone.py`) — technical math AND options chain intelligence.
3. **Converts everything to 57 numeric features** (`preprocessor.py`) — AI can only read numbers, not words like "Bullish" or "Bearish."
4. **Makes a decision** (`signal_engine.py`) — either uses the trained AI model or falls back to the 25-step rules engine.
5. **Returns the signal** — a JSON response with the final signal (BUY CE / BUY PE / WAIT), the confidence score (0–100%), and the reasoning.

### Part 3: The Executor (Dhan API via n8n)
n8n receives the signal response from the Python engine. If the signal is BUY CE or BUY PE with sufficient confidence, n8n calls the Dhan broker API to place the options order automatically.

---

## The Software Architecture

```text
Angel One ─────┐
TradingView ───┤──► n8n (Data Messenger) ──► Python AI Engine ──► Dhan (Trade Execution)
Dhan OC ───────┘                                    │
                                                    ▼
                                            Supabase (ML Feature Store - v5.0)
                                                    │
                                                    ▼
                                          React Dashboard (Live Monitoring)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Automation | n8n |
| AI Engine | Python 3.12 + FastAPI |
| Machine Learning | XGBoost Classifier (`train_model.py`) |
| Math/Indicators | Pandas + NumPy |
| Frontend Dashboard | React + Vite + TypeScript (Quantum Dark UI) |
| Broker (Orders) | Dhan API / Sandbox |
| Broker (Data) | Angel One SmartAPI |
| Data Logging | Supabase (PostgreSQL - `public.signals`) |
| Version Control | GitHub |

---

## Current Mode: ML DATA COLLECTION (v4.3 Phase 2)
The Python engine temporarily runs in RULES_FALLBACK mode while n8n continuously streams high-dimensional (64-column) market data into Supabase. The XGBoost AI model will be trained on the `ml_training_export` SQL View once sufficient uniform market history—including negative 'WAIT' signals—is collected, completing the ML pipeline transformation.
