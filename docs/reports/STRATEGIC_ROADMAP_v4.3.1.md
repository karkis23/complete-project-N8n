# 🌌 ZENITH: Strategic Command & Operational Roadmap (v4.3.1)

> **"Institutions don't trade on hunches; they trade on architectures."**  
> You have the architecture. Now, you just need to activate the intelligence.

---

## 1. System Philosophy: The Zenith Edge
Your system is designed around **Convergence Trading**. It doesn't look at one indicator; it looks for the moment when 64 different data points agree.

| Module | The "Edge" |
|---|---|
| **Structural Hub** | RLS-secured PostgreSQL ensures your data is a private goldmine. |
| **Market Intelligence** | The 57-feature vector covers Sentiment (GEX/Skew), Structure (SMC), and Momentum (RSI/MACD). |
| **Logic Guard** | The 25-step Rules Engine prevents reckless AI bets during black-swan events. |
| **The Terminal** | Professional-grade visibility that removes emotional trading. |

---

## 2. The Next Frontier: "The Oracle Protocol"
This is the single most important technical concept for your next 48 hours. **The Oracle Protocol** is the bridge between *Logging Data* and *Training AI*.

### The Logic Breakdown
Currently, your `signals` table has 1,049 rows of **Features**, but the `label` column is empty. The Oracle's job is to fill those labels by looking into the past.

1.  **Lookback Window**: T+60 minutes from signal timestamp.
2.  **Oracle Conditions**:
    - **Label 0 (CE Win)**: If (High price in window) > (LTP at signal + 40 pts) AND (Low price) stayed above (LTP - 15 pts).
    - **Label 1 (PE Win)**: If (Low price in window) < (LTP at signal - 40 pts) AND (High price) stayed below (LTP + 15 pts).
    - **Label 2 (WAIT)**: If neither condition met, or if Stop Loss was hit first.

### Why this works:
By retroactively labeling your 1,049 signals, you create a **Gold Standard Dataset**. XGBoost will see 1,049 moments in history and learn the exact "fingerprint" of a winning trade.

---

## 3. Phase-by-Phase Roadmap (The Todo List)

### 🟢 Phase A: The Handshake (Immediate)
- [ ] **Import Updated n8n JSON**: Log into n8n → Import `n8n/workflows/updated_workflow.json`. This reconnects the "Nervous System" to the new `snake_case` DB structure.
- [ ] **Heartbeat Test**: Trigger n8n once. Check Supabase table `signals`. If a new row appears with all columns filled, the "Handshake" is perfect.

### 🟡 Phase B: The Oracle Activation (Next Step)
- [ ] **Build `api/scripts/oracle_labeler.py`**: A Python script that connects to Supabase, pulls unlabeled signals, looks up historical prices (can use Dhan or Angel API), and updates the `label` column.
- [ ] **Data Audit**: Verify you have at least 150-200 "Win" labels (Label 0 or 1) and 300+ "Wait" labels. Balanced data makes for smart AI.

### 🟠 Phase C: The Intelligence Birth (ML Training)
- [ ] **Run GPU Training**: Execute `python api/scripts/train_model.py`. 
- [ ] **Model Validation**: Look at the "Feature Importance" chart. See which indicators your AI values most (is it GEX? RSI? Volume?).
- [ ] **The Switch**: Flip `ENGINE_MODE=AI_ENSEMBLE` in your `.env`.

### 🔴 Phase D: Strategic Deployment (Live Status)
- [ ] **Terminal Monitoring**: Use the `XAIPage` in your React Terminal to see the AI's "Confidence Score" in real-time.
- [ ] **Risk Gating**: Set a minimum confidence (e.g., 75%) before n8n is allowed to place a real order.

---

## 4. Closing Advice: The Quant Mindset
 Algorithmic trading is 90% preparation and 10% watching. 

**Low motivation is usually just a lack of clarity.** You aren't "stuck"—you are simply in the transformation phase. You have moved from "A person who wants to trade" to "An architect who owns a trading system."

1.  **Don't rush the Oracle**: If the labeling logic is wrong, the AI will learn the wrong lessons. Get the "Win/Loss" criteria right first.
2.  **Trust the Data Layer**: You have 1,049 samples. That is already enough for a professional-grade XGBoost model.
3.  **Celebrate the Architecture**: Look at your React Terminal. Look at your Python Engine. Look at your Secured Database. **Most retail traders in the world have absolutely nothing like this.**

**Next Action**: Import that n8n JSON and let's see that first "Heartbeat" under the new system.
