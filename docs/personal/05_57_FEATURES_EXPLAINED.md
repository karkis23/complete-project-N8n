# 05 — The 57 Features Explained
*Discussed: March 2026*

---

## Why 57 Features?

Most retail bots use 2–3 indicators ("RSI > 70 = Sell"). Your AI uses 57, because the market is never that simple.

These 57 numbers paint a complete picture of the market every 5 minutes across 9 distinct categories:

---

## Category 1: TREND (12 Features)
*Which way is the river flowing?*

| Feature | What it Measures |
|---------|-----------------|
| `trend_ema20_status` | Is the short-term trend Bullish (+1) or Bearish (-1)? |
| `trend_ema20_distance` | How stretched is price above/below the EMA? (Mean reversion alert) |
| `trend_sma50_status` | Is the medium-term trend Bullish or Bearish? |
| `trend_sma50_distance` | Distance from the 50-period baseline |
| `trend_psar_status` | Is the Parabolic SAR pointing up (Bullish) or down (Bearish)? |
| `trend_psar_distance` | How close is price to flipping the SAR direction? |
| `trend_supertrend_status` | The ultimate trailing stop indicator — Bullish or Bearish |
| `trend_aroon_up` | How recently did we hit a new HIGH? (0–1 scale) |
| `trend_aroon_down` | How recently did we hit a new LOW? (0–1 scale) |
| `trend_aroon_diff` | Buyer vs Seller dominance gap |
| `trend_adx` | How STRONG is the trend? (<0.2 = sideways garbage, >0.4 = strong trend) |
| `trend_adx_di_diff` | Internal tug-of-war between buyers (+DI) and sellers (-DI) |

---

## Category 2: MACD (6 Features)
*Is momentum accelerating or dying?*

| Feature | What it Measures |
|---------|-----------------|
| `macd_histogram` | Current MACD bar height (positive = bullish pressure) |
| `macd_prev_histogram` | MACD bar height 5 minutes ago |
| `macd_status` | Is MACD line above or below signal line? |
| `macd_flip_bullish` | Did MACD just cross FROM negative TO positive THIS bar? (1 = yes) |
| `macd_flip_bearish` | Did MACD just cross FROM positive TO negative THIS bar? (1 = yes) |
| `macd_histogram_rising` | Is the histogram growing (momentum building)? |

---

## Category 3: MOMENTUM (8 Features)
*Is the market speeding up, slowing down, or exhausted?*

| Feature | What it Measures |
|---------|-----------------|
| `momentum_rsi` | RSI (0–1 scale, where 0.7 = overbought at 70) |
| `momentum_rsi_overbought` | Is RSI above 70? (1 = yes) |
| `momentum_rsi_oversold` | Is RSI below 30? (1 = yes) |
| `momentum_rsi_neutral_bullish` | Is RSI in the 55–70 bullish zone? |
| `momentum_rsi_neutral_bearish` | Is RSI in the 30–45 bearish zone? |
| `momentum_stoch` | Stochastic oscillator (trend-filtered momentum) |
| `momentum_cci` | CCI — detects extreme price deviations from the moving average |
| `momentum_mfi` | Money Flow Index — like RSI, but includes Volume data |

---

## Category 4: VOLATILITY (8 Features)
*Is the market calm or about to explode?*

| Feature | What it Measures |
|---------|-----------------|
| `vol_bb_status` | Bollinger Band signal — Breakout Up or Breakout Down? |
| `vol_bb_position` | Where exactly is price inside the Bollinger Band? (0=lower, 1=upper) |
| `vol_bb_width` | How tight/wide is the squeeze? (Tight = explosion imminent) |
| `vol_atr` | Average True Range — how many points does NIFTY typically move per bar? |
| `vol_vix` | India VIX normalized (0.2=calm, 0.5=dangerous) |
| `vol_vix_extreme` | Is VIX above 25? (1 = yes, avoid trading) |
| `vol_vwap_status` | Is price above (Bullish) or below (Bearish) the VWAP? |
| `vol_vwap_distance` | How far is price stretched from the VWAP fairness level? |

---

## Category 5: VOLUME (8 Features)
*Is real institutional money backing this move?*

| Feature | What it Measures |
|---------|-----------------|
| `volume_spike` | Did volume suddenly explode vs. recent average? (1 = yes) |
| `volume_ratio` | How many times bigger was this candle's volume? (1.5x, 2x, etc.) |
| `volume_above_poc` | Is price above (1) or below (-1) the Point of Control (max volume price)? |
| `volume_poc_distance` | How far is price from the densest volume level of the day? |
| `volume_in_value_area` | Is price inside the 70% fair value area of the day? |
| `ha_trend` | Heikin Ashi trend — noise-filtered candle direction |
| `ha_consecutive` | How many consecutive Heikin Ashi candles in the same direction? |

---

## Category 6: OPTIONS CHAIN — THE SECRET WEAPON (10 Features)
*Reading what Market Makers and institutions are doing*

| Feature | What it Measures |
|---------|-----------------|
| `options_pcr_premium` | Put-Call Premium Ratio — are institutions spending more on Puts or Calls? |
| `options_pcr_oi` | Put-Call OI Ratio — are there more Put or Call open contracts? |
| `options_writers_zone` | Overall institutional bias — Bullish, Bearish, or Neutral? |
| `options_writers_confidence` | How convinced are the big options writers? (0–1) |
| `options_max_pain` | The exact price level where options sellers make max profit |
| `options_max_pain_distance` | How far is current spot from Max Pain? (Market gravitates toward this) |
| `options_gex_positive` | Is Gamma Exposure positive (suppresses moves) or negative (fuels explosive moves)? |
| `options_iv_skew` | IV Skew — are institutions secretly buying Puts to hedge a crash? |
| `options_ce_oi_change_direction` | Are Call writers ADDING or CLOSING their positions? |
| `options_pe_oi_change_direction` | Are Put writers ADDING or CLOSING their positions? |

---

## Category 7: SMART MONEY CONCEPTS (4 Features)
*Looking for structural breaks that signal institutional moves*

| Feature | What it Measures |
|---------|-----------------|
| `pattern_candle_score` | Combined candle pattern score (Engulfing, Hammer, etc.) |
| `smc_price_action_score` | Aggregated score of recent price swings |
| `smc_is_breakout` | Did price just break above a previous structural high? |
| `smc_is_breakdown` | Did price just break below a previous structural low? |

---

## Category 8: TIME (6 Features)
*The same signal means different things at different times*

| Feature | What it Measures |
|---------|-----------------|
| `minutes_from_open` | How many minutes since 9:15 AM? |
| `minutes_to_close` | How many minutes until 3:30 PM? |
| `session_progress` | 0.0 = market just opened, 1.0 = market about to close |
| `is_opening_drive` | Is this within the volatile first 30 minutes? (1 = yes) |
| `is_midday_session` | Is this the calm 10:15–12:45 window? (Best trade zone) |
| `is_late_session` | Is this after 2:00 PM? (Theta decay kills option buyers here) |

---

## Category 9: DATA QUALITY (2 Features)

| Feature | What it Measures |
|---------|-----------------|
| `data_candle_count` | Do we have enough historical candles for reliable math? |
| `data_today_candle_count` | How many candles have formed today specifically? |

---

## The Bottom Line
You are not just looking at price. You are looking at institutional constraints, options chain behavior, volume intelligence, and time-of-day market dynamics simultaneously. This is what separates a retail script from a professional-grade AI trading system.
