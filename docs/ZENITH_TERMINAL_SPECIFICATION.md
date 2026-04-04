# 🏙️ ZENITH: The Complete Terminal Specification

> **Version:** 4.3 (Quantum Standard)
> **Revision Date:** 2026-04-05
> **Author:** Zenith Engineering Group
> **Status:** Production Ready

---

## Executive Summary
ZENITH is a high-fidelity market analysis and automated execution terminal. It represents the pinnacle of retail trading technology, bridging the gap between discretionary analysis and algorithmic execution. By leveraging a **Python-based XGBoost Intelligence Hub** and a sophisticated **React Glassmorphic Interface**, ZENITH provides traders with an institutional-grade environment for NIFTY derivatives operations.

---

## 1. System Vision
The primary objective of ZENITH is to eliminate the "Discretionary Gap"—the space where human emotion and fatigue lead to poor execution.

### The Five Pillars of Zenith
1.  **Objective Intelligence:** Directions are calculated by the XGBoost Engine, not human intuition.
2.  **Visual Transparency:** Every KPI and logic trigger is exposed via the Deep Data Matrix (64+ features).
3.  **Risk Isolation:** Capital is managed through automated Stop-Loss, Target, and VIX-based volatility suppression (Threshold: 18+).
4.  **Operational Consistency:** Decisions occur on fixed 5-minute schedules with dynamic UI polling (30s Market / 3m Post-Market).
5.  **Audit Fidelity:** Every market engagement is recorded in the **Persistent SQL Ledger (Supabase)** with Atomic Price Locking.

---

## 2. Component Architecture

### A. Intelligence Hub (Python Microservice)
- **Role:** Feature engineering and signal generation.
- **Engine:** XGBoost with Rules-Based Fallback logic.
- **Vectors:** ADX, RSI, SuperTrend, IV Skew, Put-Call Ratio, GEX (Gamma Exposure), and Volume Profiling.
- **Protocol:** FastAPI REST endpoint for low-latency inference.

### B. Operational Matrix (n8n Orchestrator)
- **Role:** Pipeline management and state persistence.
- **Workflows:** 
  - **LIVE SIGNAL INGESTION:** Fetches market ticks and persists to Supabase Feature Store.
  - **ORDER EXECUTION:** Manages Dhan HQ connectivity and trade lifecycle.
- **Data Source:** Angel One API for high-frequency market data.

### C. Terminal Interface (React Dashboard)
- **Role:** Monitoring, system control, and audit.
- **Visuals:** Zen Midnight Design System (Glassmorphic, Slate-toned).
- **Pages:**
  - **Overview:** Real-time P&L tracking and Equity Growth Engine.
  - **Validation:** Strategy verification via Atomic Price Locking.
  - **Backtest Lab:** Hybrid simulation environment for strategy tuning.
  - **XAI:** Explainable AI panel for deep logic tracing.
  - **Workspace:** Modular diagnostic environment.

---

## 3. The Professional Terminal Design

### Layout Hierarchy
1.  **Header:** Global system health (Broker/AI/Database), market status (NIFTY/VIX), and Global Pause control.
2.  **Sidebar:** High-density navigation featuring "Quantum v4.3" modular branding.
3.  **Active Workspace:** Glassmorphic cards with fading transitions and slide-up animations.
4.  **Status Cockpit:** Floating footer with integrated diagnostic telemetry (VIX, Sync Latency, Engine Mode).

### Design Tokens
- **Background:** Midnight Obsidian (`#030307`).
- **Surface:** Glassmorphic translucent overlays with 20px - 40px blur.
- **Typography:** Inter (Standard) / JetBrains Mono (Financial Telemetry).
- **Aesthetic:** High-contrast neon accents (Quantum Azure / Proton Purple).

---

## 4. ML Feature Store (Supabase v5.0)
ZENITH treats its database not just as a log, but as a high-density feature store for model retraining.

### Signal Schema (64 Telemetry Points)
- **Meta Vector:** Processing time, engine version, session progress.
- **Technical Matrix:** RSI(14), ADX, MACD Flip, SuperTrend Validation, EMA20 Distance.
- **Derivatives Matrix:** PCR (OI/Premium), IV Skew Bias, GEX Regimes, Max Pain.
- **SMC Matrix:** POC Distance, Price Action Score, Candle Patterns, ORB Range.

### Automated Export
A built-in SQL View (`ml_training_export`) structures these columns into **57 numeric features** directly consumable by the Python training pipeline.

---

## 5. Advanced Operational Mechanisms

### Atomic Price Locking (Audit Integrity)
To prevent "result-flipping" in historical audits, the Validation Engine implements a three-phase lifecycle:
1.  **PENDING (< 10m):** Signal awaiting price development; comparison omitted.
2.  **LIVE (10m - 30m):** Comparison against the current live Nifty Spot (fluctuating).
3.  **LOCKED (> 30m):** The system anchors a historical price (Entry + 15m). Once found, the result is permanent and mathematically stable.

### Risk Suppression Protocol
- **Volatility Guard:** If India VIX > 18.0, the system automatically tags signals as `AVOID` or `SIDEWAYS`.
- **Confidence Threshold:** Signals require > 25% confidence for execution.
- **Regime Filtering:** Execution is suppressed in "Sideways" or "Compressed" volatility regimes.

---

## 6. Nomenclature Standardization

| Category | Preferred Term | Avoid |
|---|---|---|
| Main Dashboard | **Overview** | Dashboard |
| Strategy Audit | **Validation** | Reports |
| Current Bias | **Market Logic** | Prediction |
| Open Trades | **Active Positions** | Open Orders |
| Historical Data | **Trade Ledger** | Past Trades |
| AI Scoring | **Confidence Vector** | AI Percent |
| Market State | **Regime** | Environment |

---

*Zenith Project Documentation | "Precision Execution. Institutional Vision."*
