# 11 — Hardware & System Requirements: Complete Guide
*Discussed: March 2026*

---

## Overview: Three Phases, Three Different Requirements

The hardware requirements are NOT fixed. They change depending on which phase of the project you are in:
1. **Phase 1 (Now): Data Collection & Live Rules Engine** — Very low requirements
2. **Phase 2: AI Model Training (XGBoost)** — Medium requirements
3. **Phase 3 (Future): LSTM Deep Learning** — Higher requirements

---

## Phase 1: Daily Live Trading (Current Phase)
### What the machine does every 5 minutes:
- Runs the FastAPI Python server (uvicorn)
- Calculates 57 indicators using Pandas math
- Returns a JSON response to n8n
- Logs to Google Sheets

### Minimum Requirements (Absolute Floor)
| Component | Minimum | Why |
|-----------|---------|-----|
| **CPU** | Dual-core (Intel i3 / Ryzen 3, any modern generation) | Python is single-threaded; indicator math is sequential |
| **RAM** | 4 GB total (2 GB free for the engine) | Pandas loads candlestick arrays into memory |
| **Storage** | 1 GB free | Python virtual environment is ~500 MB; data files are small |
| **OS** | Windows 10 / 11 (64-bit) | Scripts are written for PowerShell |
| **Internet** | Stable broadband (5+ Mbps) | n8n must call Angel One, TradingView, Dhan APIs every 5 min |
| **Python** | 3.10 or higher (3.12 recommended) | f-strings and typing features used throughout |

### Recommended Requirements (Comfortable)
| Component | Recommended | Why |
|-----------|-------------|-----|
| **CPU** | Intel i5 / Ryzen 5 (8th gen or newer) | Faster indicator math, smoother multitasking |
| **RAM** | 8 GB | Enough to run Python server + React dashboard + browser simultaneously |
| **Storage** | 256 GB SSD | SSD makes Python startup and file I/O much faster |
| **Internet** | 10+ Mbps stable, wired preferred | Avoids timeout errors during n8n API calls |

### Current Machine Assessment (Your Setup)
Your current machine is a Windows 10/11 laptop. Based on your experience running the server, your machine is handling Phase 1 comfortably. The `Processing Ms` column in your Google Sheet shows response times of **14–52 ms** per request. This is extremely fast for a laptop Python server.

---

## Phase 2: AI Model Training (XGBoost)
### What happens during training:
- Loads the entire CSV (1,500–5,000 rows × 57 columns) into RAM
- Runs 500 decision trees across all rows
- Does 5-fold cross-validation (trains 5 separate models)
- Generates the `.pkl` files

### Training Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | Same i3 as above (takes 3–5 min) | i5/i7 with 6+ cores (takes ~45 sec) |
| **RAM** | 4 GB (tight but works for 2,000 rows) | 8 GB (comfortable even for 10,000 rows) |
| **Storage** | Same 1 GB | Same |
| **Python Packages** | xgboost, scikit-learn, joblib, pandas, numpy | Same |

### Training Time Estimates by Machine

| CPU Type | Rows of Data | Training Time |
|----------|-------------|---------------|
| Intel i3 / Ryzen 3 | 2,000 rows | ~3–5 minutes |
| Intel i5 / Ryzen 5 | 2,000 rows | ~45–90 seconds |
| Intel i7 / Ryzen 7 | 2,000 rows | ~20–40 seconds |
| Intel i5 / Ryzen 5 | 10,000 rows | ~5–8 minutes |
| Intel i7 + 16 GB RAM | 10,000 rows | ~1–2 minutes |

Training happens only once per week (or less). Even on a slow machine, 5 minutes is completely acceptable. You do not need a high-end machine for training.

---

## Phase 3: LSTM Deep Learning (Future — v5.0)
### What LSTM requires vs XGBoost:
LSTM (Long Short-Term Memory) Neural Networks are fundamentally different from XGBoost. They process sequences of time-series data (like 20 consecutive candles in a window). This is mathematically more expensive.

| Component | XGBoost Requirement | LSTM Requirement |
|-----------|--------------------|--------------------|
| **CPU** | Any modern dual-core | i7/i9 or Ryzen 7/9 minimum |
| **RAM** | 4–8 GB | 16 GB recommended |
| **GPU** | Not needed | NVIDIA GPU strongly recommended (GTX 1660 minimum) |
| **Training Time (2k rows)** | ~45 sec | ~15–60 minutes (without GPU) |
| **Training Time (2k rows)** | ~45 sec | ~2–5 minutes (with GPU) |
| **Framework** | scikit-learn + xgboost | PyTorch or TensorFlow + CUDA |

### Does your current machine support LSTM?
Probably not at full speed, but it can still be done. LSTM training can run on CPU only (much slower). For Phase 3, if you want GPU acceleration, you would look at:
- **NVIDIA GTX 1660 / RTX 3060** (mid-range, ₹18,000–₹35,000)
- Or use **Google Colab** (free GPU cloud) for training, then download the model to your laptop for inference

For now (March 2026), LSTM is months away. XGBoost on your current machine is perfectly sufficient.

---

## Network & Internet Requirements

| Scenario | Requirement | Notes |
|----------|-------------|-------|
| **Data Collection (n8n → Python API)** | 5 Mbps stable | n8n calls are small JSON packets (~10–50 KB) |
| **Angel One API** | Stable broadband | Angel One drops connection if timeout > 10 seconds |
| **TradingView connection** | Any | VIX data call is lightweight |
| **Dhan API (order execution)** | Low latency preferred | Orders must arrive within the 5-minute window |
| **Google Sheets logging** | Any | Async, non-blocking write |

### Important: Uptime Is Critical
The Python server must be running continuously from **9:10 AM to 3:35 PM** every trading day. If your laptop sleeps, closes its lid, or loses power, the server stops and data logging pauses.

**Recommendations:**
1. Disable sleep mode during market hours: Settings → Power → Sleep → Never
2. Plug into power (don't run on battery; laptops throttle CPU when on battery)
3. If possible, connect via ethernet cable instead of WiFi for stability

---

## Software Requirements (Full List)

### System Software
| Software | Version | Purpose |
|----------|---------|---------|
| Windows | 10 / 11 (64-bit) | Operating system |
| Python | 3.10+ (3.12 recommended) | Core engine language |
| Node.js | 18+ | React dashboard build |
| npm | 9+ | React package manager |
| Git | Any recent | Version control |

### Python Virtual Environment Packages (~700 MB)
| Package | Purpose |
|---------|---------|
| `fastapi` | API framework |
| `uvicorn` | ASGI web server |
| `pydantic` | Data validation |
| `pandas` | Indicator math |
| `numpy` | Numerical arrays |
| `xgboost` | Machine learning |
| `scikit-learn` | Model evaluation |
| `joblib` | Model serialization (.pkl) |
| `python-dotenv` | Environment variables |
| `httpx` | HTTP client |

### Cloud Services (No local hardware needed)
| Service | Role | Cost |
|---------|------|------|
| n8n Cloud | Automation workflow | Free tier or paid |
| Google Sheets | Data logging | Free |
| GitHub | Version control | Free |
| Angel One SmartAPI | Live candle data | Free (broker account) |
| Dhan | Order execution | Free (broker account) |

---

## Quick Reference: "Is My Machine Good Enough?"

| If your machine is... | Can it run Phase 1? | Can it train XGBoost? | Can it train LSTM? |
|-----------------------|--------------------|-----------------------|-------------------|
| Intel i3, 4 GB RAM | ✅ Yes | ✅ Yes (slow ~5 min) | ⚠️ Very slow |
| Intel i5, 8 GB RAM | ✅ Yes | ✅ Yes (fast ~1 min) | ⚠️ Slow but works |
| Intel i7, 16 GB RAM | ✅ Yes | ✅ Fast (~30 sec) | ✅ Yes (no GPU, ~30 min) |
| Any machine + NVIDIA GPU | ✅ Yes | ✅ Very fast | ✅ Yes (fast ~5 min) |

**Summary:** You do not need an expensive machine for any phase of this project right now. Phase 1 and Phase 2 run comfortably on any modern laptop. Phase 3 (LSTM) would benefit from a GPU when we reach it, but that is months away and we have options (Google Colab free tier) to work around it.
