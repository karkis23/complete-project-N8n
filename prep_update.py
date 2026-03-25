import json

# Original keys to ensure we keep existing matches, plus new ones found in rule_engine
mapping = {
    # System fields
    "timestamp": "={{new Date().toISOString()}}",
    
    # Engine Meta
    "engine_version": "={{ $json.engineVersion || '4.0.0' }}",
    "engine_mode": "={{ $json.engine_mode }}",
    
    # Price Context
    "spot_price": "={{ $node['NIFTY Option Chain Builder1'].json.spotPrice }}",
    "atm_strike": "={{ $node['NIFTY Option Chain Builder1'].json.atmStrike }}",
    "vix": "={{ $json.VIX }}",
    "vix_multiplier": "={{ $json.vixMultiplier }}",
    "combined_multiplier": "={{ $json.combinedMultiplier }}",
    "session_progress": "={{ $json.session_progress }}",
    "session_date": "={{ $json.sessionDate }}",
    
    # Market Action
    "volatility_atr": "={{ $json.volatility_atr }}",
    "price_action_score": "={{ $json.Price_action_score }}",
    "market_strength": "={{ $json.market_strength }}",
    "poc_distance": "={{ $json.poc_distance }}",
    "pa_type": "={{ $json.PA_Type }}",
    
    # Simple Indicators
    "rsi": "={{ $json.RSI }}",
    "momentum": "={{ $json.Momentum }}",
    "volume_ratio": "={{ $json.VolumeRatio }}",
    "adx": "={{ $json.ADX }}",
    "plus_di": "={{ $json.plus_di }}",
    "minus_di": "={{ $json.minus_di }}",
    
    # MACD Block
    "macd": "={{ $json.macd }}",
    "macd_flip": "={{ $json.MACDFlip }}",
    "macd_status": "={{ $json.MACD_status }}",
    
    # Trend indicators
    "super_trend": "={{ $json.SuperTrend }}",
    "supertrend_validated": "={{ $json.SuperTrendValidated }}",
    "stochastic": "={{ $json.stochastic }}",
    "cci": "={{ $json.cci }}",
    "mfi": "={{ $json.mfi }}",
    "bb_width": "={{ $json.bb_width }}",
    "aroon_up": "={{ $json.aroon_up }}",
    "aroon_down": "={{ $json.aroon_down }}",
    "ema20_distance": "={{ $json.ema20_distance }}",
    "vwap_status": "={{ $json.vwap_status }}",
    
    # Candlestick
    "candle_pattern": "={{ $json.candlePatterns ? $json.candlePatterns.join(', ') : '' }}",
    "candle_count": "={{ $json.candle_count }}",
    "today_candle_count": "={{ $json.today_candle_count }}",
    "orb_range": "={{ JSON.stringify($json.orbRange || {}) }}",
    
    # Options & Writers
    "put_call_ratio": "={{ $json.putCallOIRatio }}",
    "put_call_premium_ratio": "={{ $json.putCallPremiumRatio }}",
    "writers_zone": "={{ $json.writersZone }}",
    "writers_confidence": "={{ $json.writersConfidence }}",
    "max_pain": "={{ $json.maxPain }}",
    "max_ce_oi_strike": "={{ $json.maxCEOIStrike }}",
    "max_pe_oi_strike": "={{ $json.maxPEOIStrike }}",
    "gamma_exposure": "={{ JSON.stringify($json.gammaExposure || {}) }}",
    "Gamma_Flip Level": "={{ $json.gammaExposure?.gamma_flip }}",
    "GEX_Regime": "={{ $json.gammaExposure?.regime }}",
    "iv_skew": "={{ JSON.stringify($json.ivSkew || {}) }}",
    "IV_skew_bias": "={{ $json.ivSkew?.bias }}",
    
    # Signal State
    "regime": "={{ $json.regime }}",
    "raw_signal": "={{ $json.rawSignal }}",
    "signal": "={{ $json.finalSignal }}",
    "confidence": "={{ $json.confidence }}",
    "reason": "={{ $json.reason }}",
    "ai_insights": "={{ $json.ai_insights ? $json.ai_insights.join(' | ') : '' }}",
    "blocked_reason": "={{ $json.blockedReason }}",
    "streak_count": "={{ $json.streakCount }}",
    "streak_confirmed": "={{ $json.streakConfirmed }}",
    "LastSignal": "={{ $json.lastSignal }}",
    "LastFireTime": "={{ $json.lastFireTime }}",
    
    # Debug
    "debug_flags": "={{ $json.debugFlags ? $json.debugFlags.join(', ') : '' }}",
}

# Now we will update the n8n_update_partial_workflow via JSON payload.
workflow_path = "C:/Users/madhu/.gemini/antigravity/brain/5326c207-48d3-46e9-accf-377e9a73250e/.system_generated/steps/15/output.txt"
with open(workflow_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = data['data']['nodes']
for node in nodes:
    if node['name'] == 'Log Signal to Supabase' and node['type'] == 'n8n-nodes-base.supabase':
        # Replace the fieldValues
        field_values = [{"fieldId": k, "fieldValue": v} for k, v in mapping.items()]
        node['parameters']['fieldsUi']['fieldValues'] = field_values
        break

# Optional: Add processing_time_ms as random calculation or omit it since it's nullable.
# We'll stick to the mapped ones.

# Now save the modified workflow
# For N8N full workflow update, we export nodes and connections.
out_data = {
    "nodes": nodes,
    "connections": data['data']['connections'] if 'connections' in data['data'] else {}
}

with open("updated_workflow.json", "w", encoding="utf-8") as f:
    json.dump(out_data, f, indent=2)

print(f"Updated Log Signal map with {len(mapping)} fields to updated_workflow.json")
