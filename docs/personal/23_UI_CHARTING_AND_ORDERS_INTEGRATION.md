# Zenith UI Integration & Charting Architecture Report
*Documenting the v5.1.3 Frontend Engine Upgrades*

**Date:** April 21, 2026
**Target Architecture:** Zenith Web Application (React + Vite)
**Scope:** Integration of `ohlc_candles` and `active_exit_orders` database logic, and comprehensive bug resolution.

---

## 1. Executive Summary

This document serves to permanently log the technical upgrades applied to the Zenith Web App in version 5.1.3. Following the expansion of the PostgreSQL backend to include historical `ohlc_candles` and active risk tracking via `active_exit_orders`, the frontend required substantial upgrades. 

This update established two entirely new institutional-grade UI modules:
1. **Live Candlestick Charts** (`/charts`)
2. **Order Book Management** (`/orders`)

During this deployment, a critical browser rendering crash (producing a black screen with no React root hydration) was successfully intercepted and structurally patched.

---

## 2. Technical Bug Resolution: The "Black Screen" Rendering Crush

### 🚨 The Symptoms
Upon mounting the `/charts` route, the entire application interface disappeared, leaving a blank viewport. Standard React Error Boundaries failed to catch the crash, indicating a synchronous rendering failure during module evaluation or initial hook hydration.

Puppeteer and raw console diagnostics revealed three key errors:
1. `TypeError: newChart.addCandlestickSeries is not a function`
2. `Invalid time` (generated internally by `lightweight-charts` formatting methods).
3. Network-level CORS aborts (which were correctly circumvented by our fallback system).

### 🔍 The Root Causes & Fixes

**Issue A: API Depreciation in Dependency (`lightweight-charts` v5.1.0)**
The charting library being utilized (`lightweight-charts` by TradingView) had aggressively refactored its API signature in V5. 
*   **Old Logic:** `chart.addCandlestickSeries({ ... })`
*   **New Logic:** `chart.addSeries(CandlestickSeries, { ... })`
Because we were executing a depreciated function during the `useEffect` render cycle, React immediately panicked and unmounted the component tree context.
*   **The Fix:** Migrated the codebase completely to the new explicit syntax (`addSeries` utilizing named imported Series objects).

**Issue B: Array Reduction on Empty Data Sets**
A second logic boundary breach occurred with the signal overlapping logic. Zenith plots Buy signals onto the chart using `markers`. 
*   **The Bug:** If an array of mapped time intervals `validTimes` evaluates empty (due to database latency or null timestamps), `Array.prototype.reduce()` threw an uncaught error.
*   **The Fix:** Implemented strong mathematical gate checks:
    ```typescript
    if (!validTimes.has(timeSec)) {
        if (validTimes.size > 0) {
            const closest = Array.from(validTimes).reduce((prev, curr) => 
                Math.abs(curr - timeSec) < Math.abs(prev - timeSec) ? curr : prev
            );
            timeSec = closest;
        }
    }
    ```
Additionally, `signals.filter` now rigidly discards any object with `isNaN(new Date(s.timestamp).getTime())`.

---

## 3. Module Design Breakdowns

### A. The Live Candlesticks Module (`/charts`)
This module leverages high-performance HTML5 Canvas processing to render large datasets without DOM bloat.

**Data Pipeline:**
1. Polling hooks hit the Supabase endpoint `fetchOHLCCandles()`.
2. Sorts chronological data.
3. Automatically computes chronological overlap with the `signals` telemetry.
4. Zenith AI predictions (e.g. `BUY CE` / `BUY PE`) are mapped physically onto the nearest minute's candlestick as colored navigational arrows conveying system confidence.
5. Volume is rendered simultaneously via a linked `HistogramSeries`.

### B. The Order Book Module (`/orders`)
A real-time visual representation of the active ledger inside `active_exit_orders`.

**Features Embedded:**
1. **Color Coded Ledger:** Automatically distinguishes between Open tracking status and hit limits.
2. **Bracket Grid Analytics:** Side-by-Side metrics layout comparing Entry Price, Stop Loss, and Target limits with their exact API Order IDs.
3. **Execution Simulator:** Renders a gradient Progress / Risk-Reward tracking bar to mentally simulate physical distance from the baseline.

---

## 4. Updates to `useTrading` State Mechanics

To support the above UI routes smoothly without duplicating API requests, the global context loop (`useTrading.ts`) was updated.

1. **`candles: OHLCCandle[]` state** added.
2. **Async Polling Addition:**
    ```typescript
    const [..., candlesResult] = await Promise.allSettled([
        fetchSignals(20000), 
        fetchActiveTrades(),
        fetchTradeSummary(5000),
        fetchOHLCCandles(1000), // ← Added OHLC polling
    ]);
    ```
    This ensures that navigating to `/charts` does not invoke an artificial loading delay. The state is already aggressively cached globally.

---

## 5. Strategic Roadmap

With these foundational visual modules fully functional, Zenith now acts physically as an institutional trading desk. 

**Next Development Tiers Recommended:**
1. Leverage the `timeframe` property inside `ohlc_candles` to generate a Dropdown component allowing the chart to switch visually between `5m`, `15m`, and `1Hr` resolutions.
2. Build an Execution Latency graph inside `/orders` mapping the `execution_time` metrics to alert us if Dhan's routing algorithms are experiencing delays.
3. Extend the Candlestick series API to draw horizontal trend-lines natively on the canvas for dynamic Stop-Loss levels traversing historically.
