# 💠 Zenith Quantum Terminal v4.2.0

Zenith is a premium, high-frequency trading dashboard designed for the Indian Derivatives market (Nifty/BankNifty). It acts as a real-time visualization and audit layer for a remote Python-based Alpha Engine.

## 🏗️ System Architecture

### 1. Data Orchestration (`useTrading.ts`)
The application uses a centralized React Hook to manage all telemetry. 
- **Dynamic Polling**: Automatically adjusts sync frequency based on IST market hours (30s during market, 3m after hours).
- **Graceful Failover**: Uses `Promise.allSettled` to ensure UI parts remain functional even if specific engine diagnostics fail.

### 2. Atomic Price Locking (`ValidationPage.tsx`)
To solve the problem of "result-flipping" in signal audits, Zenith implements an atomic locking mechanism:
- **Phase 1 (Pending)**: Signals < 10m old are not evaluated.
- **Phase 2 (Live)**: Signals 10m-30m old are compared against the *live* Nifty spot price.
- **Phase 3 (Locked)**: Once a signal is > 30m old, the system searches the database for a signal generated ~15m after the entry and "anchors" the comparison price. This ensures historical win rates remain mathematically stable.

### 3. Strategy Lab Engine (`BacktestPage.tsx`)
A high-fidelity simulation environment that uses a **Hybrid Execution Model**:
- **Broker Match**: If a simulated signal matches a real-world executed trade, it uses official broker PnL (including slippage).
- **Probabilistic Fill**: If no real trade exists, it uses a deterministic RNG seeded by signal time to simulate outcomes based on confidence scores.

### 4. Design System (`index.css` & `Sidebar.tsx`)
- **Aesthetic**: "Quantum Dark" glassmorphism.
- **Micro-interactions**: Pulse animations for live connectivity, smooth slide-ins for expanded table rows.
- **Typography**: Optimized using `Inter` for UI and `JetBrains Mono` for financial telemetry.

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Data Layer**: Supabase (PostgreSQL), Axios
- **Charts**: Recharts (High-performance SVG)
- **Icons**: Lucide React

## 📊 Database Schema (`public.signals`)
The signals table is organized into high-density telemetry groups:
- **Metadata**: Core timestamps and engine versioning.
- **Market Context**: Spot prices, VIX, and session progress.
- **Technical Matrix**: RSI, MACD, ADX, Momentum, ATR.
- **Derivatives & GEX**: PCR, Gamma Exposure, IV Skew, GEX Regimes.
- **Signal Logic**: Final trade signals, confidence, and AI insights.

## 🚀 Key Features
- **Global Search & Date Filters**: Deep drill-down into signals and audit logs across all pages.
- **Telemetery Sync**: Real-time tracking of Python Engine health, database sync, and live feed latency.
- **Deep Telemetry**: Technical matrix (RSI, ADX, PCR, GEX, IV Skew) for every generated signal.

## 🤖 n8n Workflows (Production)
The system relies on these two primary active workflows:
- **LIVE TEST DATABASE** (`cVkMUvsXXmTKCc3t`): Handles live signal ingestion and Supabase persistence.
- **excution (Archived)** (`E9VXtjxIzDOirmv3`): Manages order execution and broker connectivity.

---
*Zenith — Advanced Trading Intelligence*