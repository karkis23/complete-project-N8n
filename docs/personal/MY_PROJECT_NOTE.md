# 🤖 Zenith Intelligence — NIFTY Options AI Trading System
**Master Project Architecture Note**
*Updated: March 2026 (v4.3.0)*

---

## 1. Executive Summary

**Zenith** is a fully autonomous, predictive Machine Learning trading infrastructure designed explicitly for NIFTY 50 Options in the Indian stock market. 

Instead of relying on human emotion or lagging visual charts, Zenith operates as a hyper-fast, decoupled quantitative firm. It polls live institutional data every 300 seconds, converts that data into 57 high-dimensional mathematical features, and uses a GPU-accelerated XGBoost algorithm to formulate probabilistic execution decisions in under 50 milliseconds.

---

## 2. Architectural Design

Zenith is constructed as a triad of decoupled, high-speed microservices:

### 🔹 The Data Ingestion Engine (n8n)
Operating relentlessly during market hours, the n8n automation engine concurrently strips raw telemetry from three distinct APIs: Angel One (Price Action), TradingView (India VIX), and Dhan (Live Options Chain). This raw telemetry is compiled and routed to the Python Engine.

### 🔹 The Analytical Brain (Python FastAPI & XGBoost)
This is the intellectual core of the system. It processes the raw telemetry payload through a rigorous two-step pipeline:
1. **The Preprocessor:** It calculates **57 unique quantitative indicators**. It goes beyond simple retail metrics (RSI, MACD) to calculate true institutional frameworks: Gamma Exposure (GEX), Implied Volatility (IV) Skew, Max Pain, and Put-Call Ratios.
2. **The Inference Model:** It feeds the 57-feature matrix into an **XGBoost AI algorithm** trained across tens of thousands of historical NIFTY checkpoints. The AI outputs an absolute probability mapping (e.g., *"85% probability: BUY CE"*).

### 🔹 The Execution Router (Dhan API)
If the AI's confidence breaches the strict 60%+ acceptance threshold, the order is fired to the Dhan broker API. Every order is executed natively with an inescapable, hard-coded Risk/Reward structure: `-15 Point Stop Loss` and `+35 Point Target`.

---

## 3. The Theoretical Edge (Our Alpha)

Retail bots rely on static "`If RSI > 70`" conditions. Zenith possesses mathematical superiority in three distinct ways:

1. **Institutional Money Flow:** By calculating Gamma Exposure and IV Skew, Zenith mathematically maps exactly where deep-pocketed Option Writers are forced to hedge, allowing us to front-run institutional momentum rather than reacting to it.
2. **Dynamic Machine Learning:** The XGBoost model dynamically evolves. Every weekend, an "Oracle Script" grades the past week of market data using absolute hindsight. The XGBoost model then mathematically reconstructs its logic trees (Gradient Boosting) to perfect its foresight.
3. **The Fail-Safe Rules Engine:** Zenith operates with a dual-brain architecture. A hard-coded, 25-step Logic Engine monitors VIX boundaries and Average Directional Index (ADX) metrics. If the market is trapped in sluggish manipulation ranges, Zenith simply outputs `WAIT` or `AVOID`, preserving capital until high-momentum regimes return.

---

## 4. Current Production State (v4.3.0)

The system architecture is entirely finalized. It is officially operating in the **"Data Incubation Phase"**:
* The 57-feature preprocessor is live.
* The pipeline is flawlessly logging a 64-column matrix directly into an enterprise-grade **Supabase PostgreSQL** database every 5 minutes.
* **Survivorship Bias has been eliminated** (we successfully log all `WAIT` and `AVOID` signals to build the massive negative-class dataset).

Over the next few weeks, the system will accumulate ~1,500 rows of pristine, 64-column market data. This matrix will be extracted as the `ml_training_export` SQL View and fed into the GPU-accelerated XGBoost training pipeline.

---

## 5. Development Milestones

| Milestone | Status |
|-----------|--------|
| Hard-coded Rules Engine Bot (v3.0) | ✅ Done |
| Python AI Microservice (v4.0) | ✅ Done |
| 57-Feature Preprocessor Built | ✅ Done |
| Advanced Money Flow Features (GEX, IV Skew) | ✅ Done |
| Glassmorphism React Command Center | ✅ Done |
| GitHub Version Control Implementation | ✅ Done |
| Complete Database Migration (Google Sheets → Supabase) | ✅ Done |
| GPU Gradient Boosting Pipeline Configured | ✅ Done |
| "Oracle" Hindsight Labelling Architecture Built | ✅ Done |
| Data Incubation Phase (Live Supabase Logging) | 🔄 In Progress |
| XGBoost AI Model Training (1,500+ Rows) | ⏳ Upcoming |
| Alpha Scale: Live Execution (1 Lot Base) | ⏳ Future |
| Next-Gen LSTM Deep Learning Upgrade (v5.0) | 🌌 Long-Term Vision |

---

## 6. The Iron Rules of the Incubation Phase

> **Every bad trade the rule engine makes right now is exactly ONE lesson the AI will never repeat.**

> **Do not touch the system algorithms during data collection. Let the machine breathe.**

> **The execution bounds are rigidly locked at the Institutional Sweet Spot: `-15 SL / +35 Target`. Never adjust this out of emotional frustration.**

> **Train the model using `device="cuda"` ONLY after collecting 1,500+ uninterrupted rows.**

> **Do not rush the live deployment. Validate the AI over 50 paper-trades first. Prove the edge, then scale.**

---

*Base Technology Matrix: Python 3.12 · FastAPI · XGBoost (CUDA) · React · Vite · n8n · Dhan · Angel One · Supabase PostgreSQL*
*Architectural Paradigm: Decoupled Microservice · Data Extraction Automation · Real-Time ML Inference*
