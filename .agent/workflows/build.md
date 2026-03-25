---
description: System maintenance, ML retraining, and deployment workflows
---
# Zenith Quantum Trading Bot — Operations & Maintenance

## Phase 1: Machine Learning Retraining Pipeline
1. Dump continuous telemetry data from Supabase (`ml_training_export` View).
2. Execute `api/scripts/train_model.py` to stratify and tune the XGBoost matrices.
3. Deploy new `model.pkl` to `api/engine/models/` seamlessly avoiding server downtime.
4. Re-benchmark Sharpe Efficiency in Strategy Tester.

## Phase 2: Local Server Hardening & Security
1. Establish continuous running state for `api/main.py` via local robust managers (e.g., PM2 or Docker).
2. Hardcode and optimize n8n HTTP Request endpoints precisely to `localhost` to ensure zero external latency.
3. Serve React Terminal (`src/`) securely on a dedicated local port with automatic process recovery.
4. Ensure all environment components operate 100% locally with no cloud deployment exposure.

## Phase 3: Risk Management Module v5.0
1. Build intelligent position sizing (Lot scaling based on VIX / Account Equity).
2. Integrate strict daily global drawdown circuits.
3. Establish robust "Paper Trading" toggle within React Dashboard overriding Dhan API execution nodes.

// turbo-all
