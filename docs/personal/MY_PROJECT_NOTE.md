# 🤖 Zenith Intelligence — NIFTY Options AI Trading System
**My Personal Project Note**
*Written: March 2026*

---

## What is this project?

Zenith is a fully automated, AI-powered trading system designed specifically for NIFTY 50 Options in the Indian stock market. Instead of a human sitting in front of charts for 6 hours a day, making emotional decisions based on gut feeling, Zenith runs silently in the background, reads the live market every 5 minutes, makes a cold mathematical decision, and — when it is confident enough — executes the trade automatically.

---

## How does it work? (The Simple Version)

Think of it as a three-person team working together, but they are all software:

### 🔹 The Data Runner (n8n)
Every 5 minutes during market hours, this automation engine collects live data from three sources simultaneously: real-time candle prices from Angel One, India VIX from TradingView, and the live Options Chain from Dhan. It packages everything into a neat bundle and hands it to the Brain.

### 🔹 The Brain (Python AI Engine)
This is the heart of the system. It receives the data bundle and runs it through two levels of analysis:
- First, it calculates **57 unique market indicators** — everything from standard tools like RSI and MACD to institutional-grade data like Gamma Exposure (GEX), IV Skew, and Max Pain. These are the same metrics used by professional options traders and market makers.
- Then, it feeds all 57 numbers into an **XGBoost Machine Learning model** that has been trained on months of real market data. The AI outputs a probability score — for example: *"85% confident this is a BUY CALL."*

### 🔹 The Executor (Dhan API)
If the AI's confidence exceeds the threshold (60%+), it sends the trade order directly to the Dhan broker API, which executes the options order in under a second.

---

## What makes this different from a basic trading bot?

Most trading bots look at 2 or 3 indicators and follow simple "if RSI > 70, sell" rules. Zenith is fundamentally different in three ways:

1. **It reads Institutional Money Flow** — By analyzing the Options Chain (GEX, Max Pain, IV Skew, Put-Call Ratio), the system can detect where big Market Makers and institutional investors are positioned, which gives it a massive edge over bots that only read price charts.

2. **It uses Machine Learning** — Unlike rule-based bots that blindly follow the same logic forever, Zenith's XGBoost model learns and improves over time. Every week, it can be retrained on new data, allowing it to adapt to changing market conditions.

3. **It has a Safety Net** — Even if the AI model is unavailable, the system automatically falls back to a strict, time-tested 25-step rules engine that mirrors the original trading logic. It never operates blindly.

---

## Where is it right now?

The entire system is built and deployed. It is currently running in **"Data Collection Mode"** — the rules engine is live, generating 5-minute market snapshots, and logging everything to a Google Sheet.

Over the next **1 to 2 months**, this data will be used to train the XGBoost AI model. Once trained, the system switches from rules to full AI inference automatically, with no changes needed to any part of the pipeline.

---

## The Vision

The long-term goal is a fully self-improving trading system. Every week, new data feeds back into the model. Every month, the model gets sharper, faster, and more accurate.

The system is also architected to eventually upgrade from XGBoost to a deep **LSTM Neural Network**, allowing it to understand the *time sequence* of price movement — the same technology used by Wall Street quantitative hedge funds.

---

## My Journey

| Milestone | Status |
|-----------|--------|
| n8n-based rules bot (v3.0) | ✅ Done |
| Python AI microservice (v4.0) | ✅ Done |
| 57-feature preprocessor | ✅ Done |
| Options chain intelligence (GEX, IV Skew, Max Pain) | ✅ Done |
| React Command Center Dashboard | ✅ Done |
| GitHub version control | ✅ Done |
| Live data collection (Google Sheets logging) | 🔄 In Progress |
| XGBoost AI model training | ⏳ Upcoming (1-2 months) |
| AI_ENSEMBLE live trading | ⏳ Future |
| LSTM deep learning upgrade (v5.0) | 🌌 Vision |

---

## Key Reminders

> **Every bad trade the rule engine makes right now = one lesson the AI will never repeat.**

> **Do not touch the code during data collection. Let the system breathe.**

> **Train the model only after collecting 1,500+ rows of live market data.**

> **Start small when the AI goes live. 1 lot first. Prove the edge. Then scale.**

---

*Built on: Python 3.12 · FastAPI · XGBoost · React · Vite · n8n · Angel One · Dhan · Google Sheets*
*Architecture: Microservice · Event-Driven · Real-Time ML Inference*
*Repository: github.com/karkis23/complete-project-N8n*
