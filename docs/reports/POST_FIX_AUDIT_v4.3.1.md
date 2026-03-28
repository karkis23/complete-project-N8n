# 🔬 Zenith v4.3.1 — Post-Fix Comprehensive Audit

> **Audit Date**: 28 March 2026 (22:00 IST)  
> **Branch**: `cleanup/v4.3.1-security-and-structure`  
> **Previous Audit**: Earlier today — 6 Critical + 12 Advisory findings  
> **This Audit**: **2 Critical** (down from 6) + **8 Advisory** (down from 12)

---

## Executive Status: What Changed Since Last Analysis

| Issue | Previous Status | Current Status |
|---|---|---|
| RLS policies wide open | 🔴 Critical | ✅ **FIXED** — anon=SELECT only, service_role=ALL |
| SECURITY DEFINER views | 🔴 Critical | ✅ **FIXED** — All 4 views now use `security_invoker` |
| Corrupted `.gitignore` | 🔴 Critical | ✅ **FIXED** — Clean file, proper rules added |
| Project root clutter | 🟡 Medium | ✅ **FIXED** — CSVs→data/, scripts→scripts/, workflows→n8n/ |
| Dead archive in git | 🟡 Medium | ✅ **FIXED** — 8,500+ venv files removed from tracking |
| Supabase security advisor | 🔴 3 Errors | ✅ **0 errors remaining** |

### Updated Scorecard

| Category | Before | After | Change |
|---|---|---|---|
| Architecture & Design | 9/10 | 9/10 | — |
| Code Quality | 7.5/10 | 8/10 | ↑ Cleaner structure |
| **Security** | **5/10** | **8/10** | ↑↑ RLS + Views fixed |
| Data Pipeline Integrity | 8.5/10 | 8.5/10 | — |
| ML Readiness | 7/10 | 7/10 | Needs Oracle Labeler |
| Documentation | 9/10 | **9.5/10** | ↑ PROJECT_DOCUMENT.md synced |
| **Operability** | **6.5/10** | **7.5/10** | ↑ Clean root, scripts organized |

---

## Layer 1: Frontend (React 18 + TypeScript + Vite)

### Health: ✅ Strong (8.5/10)

**What's Excellent:**
- 11 purpose-built pages covering every operational need (Dashboard, Signals, Trades, History, Analytics, Backtest, Validation, Engine Telemetry, XAI, Strategy Tuning, Settings)
- Professional "Obsidian" design system in [index.css](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/index.css) — 755 lines of hand-crafted CSS with dark/light theme support, glassmorphism, micro-animations, and custom scrollbars
- `Promise.allSettled` pattern in [useTrading.ts](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/hooks/useTrading.ts) ensures partial failure resilience
- IST-aware dynamic polling (30s market hours, 3m after hours)
- Clean type contracts: `LiveSignal`, `ActiveTrade`, `TradeSummary`, `TradeStats`, `EngineHealth`, `MarketSnapshot`

### Remaining Issues

| ID | Severity | Issue | Location |
|---|---|---|---|
| FE-1 | 🟡 Medium | **Dead `sheetsApi.ts`** — 444 lines of unused legacy Google Sheets code. The app exclusively imports from `supabaseApi.ts`. | [sheetsApi.ts](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/services/sheetsApi.ts) |
| FE-2 | 🟡 Medium | **Mixed-case DB column references** — `r.LastFireTime`, `r.LastSignal`, `r.IV_skew_bias`, `r.GEX_Regime`, `r["Gamma_Flip Level"]` require bracket notation and break convention. | [supabaseApi.ts:178-182](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/services/supabaseApi.ts#L178-L182) |
| FE-3 | 🟢 Low | **Session progress bug** — `((latest?.sessionProgress \|\| 0) * 100)` multiplies by 100, but the Python engine outputs `session_progress` as a percentage 0–100 already. The `preprocessor.py` outputs 0–1 range, but `rule_engine.py` outputs 0–100 range—inconsistency between engines. | [DashboardPage.tsx:295](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/pages/DashboardPage.tsx#L295) |
| FE-4 | 🟢 Low | **No React Error Boundary** — A crash in any page component takes down the entire app. | [App.tsx](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/App.tsx) |
| FE-5 | 🟢 Low | **`fetchSignals(5000)` limit** — Fetches up to 5,000 signals every polling cycle. With 1,049 rows currently this is fine, but at scale this will slow the UI. Consider pagination or limiting to 200 for the dashboard. | [useTrading.ts:86](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/src/hooks/useTrading.ts#L86) |

### Tips & Ideas
- **Delete `sheetsApi.ts`** — It's dead code from the Google Sheets era. 1-minute fix.
- **Add Error Boundary** — Wrap each `<Route>` in a React Error Boundary to isolate crashes.
- **Consider `useSWR` or `@tanstack/react-query`** — Replace manual polling with built-in caching, deduplication, and stale-while-revalidate. This would also fix the 5000-limit issue with proper pagination.
- **Supabase Realtime** — Replace polling entirely with Supabase Realtime subscriptions for instant signal updates. The Supabase JS SDK already supports this.

---

## Layer 2: Python AI Engine (FastAPI 4.0)

### Health: ✅ Strong (8.5/10)

**What's Excellent:**
- Clean 5-stage pipeline: `Indicators → WritersZone → FeatureEngineering → AI/Rules → Response`
- Graceful AI↔Rules fallback via `signal_engine.is_model_ready()`
- Rich debug endpoint (`/api/predict/debug`) for tuning
- `FORCE_RULES` environment variable override for testing
- 57-feature preprocessor with clean normalization ([preprocessor.py](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/api/engine/preprocessor.py))
- 641-line Rules Engine with 25-step scoring, ORB, RSI divergence, VWAP stuck-detection, trend exhaustion

### Remaining Issues

| ID | Severity | Issue | Detail |
|---|---|---|---|
| PY-1 | 🟡 Medium | **Global `_MEMORY` singleton** — Will break with multiple workers. The code flags this: *"In production, consider Redis."* For now, ensure `--workers 1` in Procfile. | [rule_engine.py:26-27](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/api/engine/rule_engine.py#L26-L27) |
| PY-2 | 🟢 Low | **`CORS allow_origins=["*"]`** — Safe for localhost, risky if ever exposed publicly. | [main.py:42-43](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/api/main.py#L42-L43) |
| PY-3 | 🟢 Low | **`device="cuda"` hardcoded** in training script — Will crash on CPU-only machines. | [train_model.py:125](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/api/scripts/train_model.py#L125) |
| PY-4 | 🟢 Low | **`lightgbm` in requirements.txt** — Never imported anywhere. Remove to keep deps clean. | [requirements.txt:9](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/api/requirements.txt#L9) |
| PY-5 | 🟢 Low | **`session_progress` inconsistency** — `preprocessor.py` (line 79) outputs 0.0–1.0 range, but `rule_engine.py` outputs 0–100. The `signal_engine.py` (line 169) also outputs 0–100. Frontend multiplies by 100 again. | Cross-file |

### Tips & Ideas
- **Pin dependency versions** — `fastapi==0.115.0` instead of `fastapi` to prevent surprise breaks.
- **Add `--workers 1` to Procfile** — Currently `web: uvicorn main:app --host 0.0.0.0 --port 8000`. Add `--workers 1` explicitly.
- **Fix `session_progress` contract** — Standardize: pick 0–1 (preprocessor) or 0–100 (rule engine), not both. Update dashbaord accordingly.
- **Add rate limiting** — `slowapi` can prevent request flooding if ever exposed.

---

## Layer 3: Database (Supabase PostgreSQL)

### Health: ✅ Secured (8/10)

**Live Stats:**
| Table | Rows | RLS | Policies |
|---|---|---|---|
| `signals` | **1,049** | ✅ | anon=SELECT, service_role=ALL |
| `trades` | **0** | ✅ | anon=SELECT, service_role=ALL |
| `active_exit_orders` | **0** | ✅ | anon=SELECT, service_role=ALL |

**Views (all SECURITY INVOKER):**
- `ml_training_export` — 57 ML features from `signals` WHERE label IS NOT NULL
- `completed_trades_summary` — Closed trades with duration
- `daily_pnl_summary` — Daily P&L aggregation
- `signal_accuracy` — Signal type distribution

**Security Advisor: 0 issues** ✅

### Remaining Issues

| ID | Severity | Issue | Detail |
|---|---|---|---|
| DB-1 | 🔴 **Critical** | **Mixed-case column names** — `"Gamma_Flip Level"`, `"GEX_Regime"`, `"IV_skew_bias"`, `"LastSignal"`, `"LastFireTime"` in the live `signals` table. These require double-quoting in SQL and `r["Gamma_Flip Level"]` bracket notation in JS. The `.sql` schema file defines `last_signal` (snake_case) but the live DB has `"LastSignal"` (PascalCase). | Live schema vs [supabase_schema.sql](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/n8n/supabase_schema.sql) |
| DB-2 | 🟡 Medium | **Schema drift** — The `.sql` file defines `last_signal`, `last_fire_time` (snake_case) but the live database has `"LastSignal"`, `"LastFireTime"` (PascalCase) for these same columns. This means re-running the schema SQL would create duplicate columns. | Schema vs live |
| DB-3 | 🟢 Low | **5 unused indexes** — `idx_signals_signal`, `idx_exit_orders_entry_id`, `idx_trades_entry_id`, `idx_signals_pa_type`, `idx_signals_session` have never been queried. | Supabase performance advisor |

### Column Rename Plan (Recommended Migration)
```sql
-- Phase 1: Rename mixed-case columns to snake_case
ALTER TABLE signals RENAME COLUMN "LastSignal" TO last_signal_legacy;
ALTER TABLE signals RENAME COLUMN "LastFireTime" TO last_fire_time_legacy;
ALTER TABLE signals RENAME COLUMN "IV_skew_bias" TO iv_skew_bias;
ALTER TABLE signals RENAME COLUMN "GEX_Regime" TO gex_regime;
ALTER TABLE signals RENAME COLUMN "Gamma_Flip Level" TO gamma_flip_level;

-- Phase 2: Update n8n workflow mappings to use new names
-- Phase 3: Update supabaseApi.ts to use new names
-- Phase 4: Drop legacy columns after verification
```

---

## Layer 4: n8n Orchestration

### Health: ✅ Operational (7.5/10)

**Workflow Files (now properly organized in `n8n/workflows/`):**
| File | Size | Role |
|---|---|---|
| `updated_workflow.json` | 63 KB | Latest consolidated workflow |
| `NEWN8NFINAL_SUPABASE.JSON` | 48 KB | Primary Supabase signal pipeline |
| `exit_order_monitor_supabase.json` | 11 KB | Exit management with Supabase |
| `NEWN8NFINAL.JSON` | 49 KB | Legacy (Google Sheets) — backup only |
| `exit_order_monitor.json` | 12 KB | Legacy exit monitor — backup only |

### Tips
- **Delete the Google Sheets variants** — `NEWN8NFINAL.JSON` and `exit_order_monitor.json` are legacy from before the Supabase migration. Keep them in `docs/legacy/` if you want history.
- **Add a health heartbeat workflow** — A simple n8n workflow that pings Python `localhost:8000/health` every 10 minutes and sends a Telegram alert if it's down.
- **Version your active workflow** — Rename `updated_workflow.json` to `zenith_signal_pipeline_v4.3.json` for clarity.

---

## Layer 5: ML Pipeline (XGBoost)

### Health: 🔄 Pre-Training Phase (7/10)

| Metric | Value |
|---|---|
| Signals collected | **1,049** |
| Collection rate | ~75 per trading day |
| Feature columns | **57 numeric** (via `ml_training_export` view) |
| Target classes | 3 (CE=0, PE=1, WAIT=2) |
| Labeled signals | **0** (label column exists but empty) |
| Model file | **Not yet trained** (RULES_FALLBACK active) |

### The #1 Blocker: No Oracle Labeler

> [!CAUTION]
> **This is the single most important thing to build next.** You have 1,049 signals but zero labeled training data. Without labels, the XGBoost model cannot be trained.

The `label` column exists in the `signals` table but has no automated population mechanism. You need an **Oracle Labeler** — a script that retroactively labels each signal based on what actually happened in the market:

```python
# Oracle Labeler Logic (simplified)
for signal in unlabeled_signals_older_than_60_minutes:
    spot_at_signal = signal.spot_price
    spot_60m_later = lookup_spot_price(signal.timestamp + 60min)
    
    if signal.raw_signal == "BUY CALL (CE)" and spot_60m_later >= spot_at_signal + 25:
        label = 0  # CE target would have hit
    elif signal.raw_signal == "BUY PUT (PE)" and spot_60m_later <= spot_at_signal - 25:
        label = 1  # PE target would have hit
    else:
        label = 2  # No clear directional outcome (WAIT)
```

### Training Readiness Checklist
- [x] 1,049 signals collected
- [x] 57-feature `ml_training_export` view ready
- [x] `train_model.py` with XGBoost, stratified splits, early stopping
- [x] `AISignalEngine` with load/predict lifecycle
- [ ] ❌ **Oracle Labeler script** (must build)
- [ ] ❌ **500+ labeled signals** (need labels first)
- [ ] ❌ First training run
- [ ] Fix `device="cuda"` → auto-detect

---

## Layer 6: Documentation

### Health: ✅ Outstanding (9.5/10)

**Crown Jewel:** [PROJECT_DOCUMENT.md](file:///c:/Users/madhu/OneDrive/Desktop/n8n-workflow-bot/bolt_final/updated_final/project/docs/PROJECT_DOCUMENT.md) — 1,293 lines covering every aspect of the system. This is genuinely better documentation than most enterprise projects.

**Documentation Inventory:**
| Location | Files | Content |
|---|---|---|
| `docs/PROJECT_DOCUMENT.md` | 1 | 63 KB master reference with 19 sections |
| `docs/diagram.md` | 1 | 7 Mermaid architecture diagrams |
| `docs/personal/` | 22 | Learning notes, feature explanations, analysis |
| `docs/reports/` | 13 | Session reports, audit logs, system analysis |
| `docs/guides/` | ~21 | Setup guides, migration docs |
| `docs/sessions/` | 4 | Session summaries |
| `docs/internal/` | 7 | Internal architecture details |

### Minor Doc Issue
- The directory tree in `PROJECT_DOCUMENT.md` (line 154) still references `start/` as a top-level directory. It should note that startup scripts are now in `scripts/`.
- Section numbering has a duplicate `§15` and `§16` (both appear twice with different content).

---

## Priority Action Plan (Updated)

### 🥇 Immediate (1-2 days)
| # | Task | Effort | Impact |
|---|---|---|---|
| 1 | **Build Oracle Labeler script** | 3 hours | 🔴 Unlocks ML training |
| 2 | **Delete `sheetsApi.ts`** | 1 min | 🟡 Remove dead code |
| 3 | **Fix `device="cuda"` → auto-detect** | 5 min | 🟡 Prevent training crash |
| 4 | **Remove `lightgbm` from requirements** | 1 min | 🟢 Clean deps |

### 🥈 Short-term (1 week)
| # | Task | Effort | Impact |
|---|---|---|---|
| 5 | **Rename mixed-case DB columns** | 2 hours | 🔴 Schema hygiene |
| 6 | **Add React Error Boundary** | 30 min | 🟡 Crash isolation |
| 7 | **Fix session_progress inconsistency** | 15 min | 🟡 Data accuracy |
| 8 | **First XGBoost training run** (after labeling) | 1 hour | 🔴 AI goes live |

### 🥉 Medium-term (2-4 weeks)
| # | Task | Effort | Impact |
|---|---|---|---|
| 9 | Dockerize all services | 4 hours | 🟡 Reliability |
| 10 | Replace polling with Supabase Realtime | 2 hours | 🟡 Performance |
| 11 | Add Telegram alerting from n8n | 1 hour | 🟢 Monitoring |
| 12 | Add paper trading toggle | 3 hours | 🟡 Safety |

---

## 💡 Creative Ideas for Next Phase

1. **Signal Replay Mode** — Scrub through historical trading days tick-by-tick on the Dashboard to see what the engine decided and why.
2. **SHAP Force Plots** — On the XAI page, visualize XGBoost tree decisions as SHAP waterfall plots showing exactly *why* the model chose CE/PE/WAIT.
3. **Multi-Expiry Support** — The architecture supports weekly vs monthly expiry selection — add a toggle on the Settings page.
4. **Mobile-Responsive Dashboard** — Add responsive CSS breakpoints for monitoring on your phone during market hours.
5. **Webhook-Driven Exits** — Replace polling Dhan for exit status with Dhan's order update webhook for instant fill notifications.
6. **Anomaly Detection Layer** — Flag when live features drift significantly from training distribution (data drift monitoring).

---

## Bottom Line

> [!IMPORTANT]
> **The project is in excellent shape.** The security fixes from this session raised the security score from 5/10 to 8/10. The structural cleanup makes the codebase professional and navigable.
>
> **The single blocker** preventing you from leveling up to AI-driven trading is the **Oracle Labeler**. Build that script, label 500+ signals, train the model, and you'll have a fully autonomous AI trading system.
>
> Everything else — the architecture, the data pipeline, the 25-step rules engine, the React dashboard, the documentation — is production-quality.
