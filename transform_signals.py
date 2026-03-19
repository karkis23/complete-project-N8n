import pandas as pd
import os

input_file = r"c:\Users\madhu\OneDrive\Desktop\n8n-workflow-bot\bolt_final\updated_final\project\Dhan Trading Bot Data - Dhan_Signals (1).csv"
output_file = r"C:\Users\madhu\OneDrive\Desktop\n8n-workflow-bot\bolt_final\updated_final\project\signals_migration.csv"

# Read the CSV
df = pd.read_csv(input_file, skipinitialspace=True)

# Define column mapping (CSV Header -> Supabase Column)
mapping = {
    'Timestamp': 'timestamp',
    'Signal': 'signal',
    'Confidence': 'confidence',
    'RSI': 'rsi',
    'MACD': 'macd',
    'Momentum': 'momentum',
    'Volume Ratio': 'volume_ratio',
    'VIX': 'vix',
    'Writers Zone': 'writers_zone',
    'Candle Pattern': 'candle_pattern',
    'Spot Price': 'spot_price',
    'Put Call Premium Ratio': 'put_call_ratio',
    'Writers Confidence': 'writers_confidence',
    'Reason': 'reason',
    'Regime': 'regime', 
    'ADX': 'adx',
    'rawSignal': 'raw_signal',
    'StreakCount': 'streak_count',
    'MACDFlip': 'macd_flip',
    'BlockedReason': 'blocked_reason',
    'engineVersion': 'engine_version',
    'AI Insights': 'ai_insights',
    'IV Skew': 'iv_skew',
    'SuperTrend': 'super_trend',
    'ATM Strike': 'atm_strike',
    'Gamma Flip Level': 'gamma_exposure'
}

# Rename columns
migration_df = df.rename(columns=mapping)

# Duplicate 'regime' to 'sentiment'
if 'regime' in migration_df.columns:
    migration_df['sentiment'] = migration_df['regime']
else:
    migration_df['sentiment'] = None

# Add missing columns with nulls (excluding id and created_at)
missing_columns = [
    'market_strength', 'engine_mode', 
    'price_action_score', 'poc_distance', 'volatility_atr', 'session_progress'
]

for col in missing_columns:
    if col not in migration_df.columns:
        migration_df[col] = None

# Ensure market_strength has a default
migration_df['market_strength'] = 0.0

# Format timestamp. Localize from IST (Dhan default) to UTC.
migration_df['timestamp'] = pd.to_datetime(migration_df['timestamp'], dayfirst=True)
migration_df['timestamp'] = migration_df['timestamp'].dt.tz_localize('Asia/Kolkata').dt.tz_convert('UTC')

# Clean numeric columns
numeric_cols = [
    'confidence', 'rsi', 'macd', 'momentum', 'volume_ratio', 'vix', 
    'spot_price', 'put_call_ratio', 'writers_confidence', 'market_strength',
    'adx', 'streak_count', 'gamma_exposure', 'iv_skew', 
    'price_action_score', 'poc_distance', 'volatility_atr', 'session_progress', 'atm_strike'
]

for col in numeric_cols:
    if col in migration_df.columns:
        migration_df[col] = pd.to_numeric(migration_df[col], errors='coerce')

# REMOVED 'id' and 'created_at' from the final columns list.
# Supabase will automatically generate these on import.
final_columns = [
    'timestamp', 'signal', 'confidence', 'rsi', 'macd', 'momentum', 'volume_ratio', 
    'vix', 'sentiment', 'writers_zone', 'candle_pattern', 'spot_price', 'market_strength', 
    'put_call_ratio', 'writers_confidence', 'reason', 'regime', 'adx', 
    'raw_signal', 'streak_count', 'macd_flip', 'blocked_reason', 'engine_version', 
    'engine_mode', 'ai_insights', 'gamma_exposure', 'iv_skew', 'super_trend', 
    'price_action_score', 'poc_distance', 'volatility_atr', 'session_progress', 'atm_strike'
]

# Keep only requested columns
migration_df = migration_df[final_columns]

# Save to CSV
migration_df.to_csv(output_file, index=False)
print(f"Migration file REGENERATED at: {output_file}")
print("Note: 'id' and 'created_at' removed to allow Supabase to auto-generate them.")
print(f"Columns included: {len(final_columns)}")
