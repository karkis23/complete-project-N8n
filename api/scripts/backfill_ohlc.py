"""
╔══════════════════════════════════════════════════════════════╗
║  ZENITH — OHLC Historical Backfill Script                    ║
║  Fetches last 30 days of 5-min NIFTY candles from Angel One  ║
║  Bulk inserts into Supabase ohlc_candles table               ║
╚══════════════════════════════════════════════════════════════╝

Created: April 18, 2026
Version: 1.0.0

Usage:
  cd api
  .venv\Scripts\python.exe scripts/backfill_ohlc.py

Requires:
  - Angel One SmartAPI credentials (same as n8n workflow)
  - Supabase URL + anon key (hardcoded)
  - requests, python-dateutil (already in requirements.txt)
  - TOTP code from authenticator app (prompted at runtime)

Run History:
  2026-04-18: 975 candles inserted | 600 skipped | 13 days | 14.0s

Notes:
  - Safe to re-run. Uses ON CONFLICT DO NOTHING (PostgREST ignore-duplicates).
  - Angel One allows max ~2000 candles per request; script batches at 5 days.
  - TOTP codes expire every 30 seconds — enter quickly when prompted.
"""

import os
import sys
import json
import time
import requests
from datetime import datetime, timedelta
from dateutil import parser as dateparser

# ── Configuration ──────────────────────────────────────────────
# Angel One API (same credentials as n8n workflow)
ANGEL_ONE_API_KEY = "20xgUtKh"
ANGEL_ONE_CLIENT_CODE = "K589212"
ANGEL_ONE_PASSWORD = "2323"
ANGEL_ONE_LOGIN_URL = "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword"
ANGEL_ONE_CANDLE_URL = "https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData"

# TOTP - We'll need pyotp for this
try:
    import pyotp
    TOTP_SECRET = None  # Will be set from user input if needed
except ImportError:
    pyotp = None

# Supabase
SUPABASE_URL = "https://cjaisanrglixvpoioziv.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYWlzYW5yZ2xpeHZwb2lveml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NDAxODEsImV4cCI6MjA4OTUxNjE4MX0.aFdXxDnlw0OkdQ-yLa07yTtXRhjCkbQp_paTQJ3KewQ"

# NIFTY 50 symbol token for Angel One Historical API
NIFTY_SYMBOL_TOKEN = "99926000"
NIFTY_EXCHANGE = "NSE"

# Angel One historical API limit: max 30 days at a time for 5-min candles
BACKFILL_DAYS = 30
BATCH_SIZE = 5  # Days per API request (Angel One limit per request is ~2000 candles)

# Trading hours (IST)
MARKET_OPEN_HOUR = 9
MARKET_OPEN_MIN = 15
MARKET_CLOSE_HOUR = 15
MARKET_CLOSE_MIN = 30


def get_angel_one_token(totp_value: str) -> str:
    """Login to Angel One and get JWT token."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": "127.0.0.1",
        "X-MACAddress": "10-5F-AD-60-7A-ED",
        "X-PrivateKey": ANGEL_ONE_API_KEY,
    }

    body = {
        "clientcode": ANGEL_ONE_CLIENT_CODE,
        "password": ANGEL_ONE_PASSWORD,
        "totp": totp_value,
    }

    print("🔐 Logging into Angel One...")
    resp = requests.post(ANGEL_ONE_LOGIN_URL, headers=headers, json=body, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    if data.get("status") and data.get("data", {}).get("jwtToken"):
        token = data["data"]["jwtToken"]
        print(f"   ✅ Login successful! Token: ...{token[-20:]}")
        return token
    else:
        print(f"   ❌ Login failed: {data.get('message', 'Unknown error')}")
        sys.exit(1)


def fetch_candles(jwt_token: str, from_date: str, to_date: str) -> list:
    """Fetch 5-min candles from Angel One Historical API."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": "127.0.0.1",
        "X-MACAddress": "10-5F-AD-60-7A-ED",
        "X-PrivateKey": ANGEL_ONE_API_KEY,
        "Authorization": f"Bearer {jwt_token}",
    }

    body = {
        "exchange": NIFTY_EXCHANGE,
        "symboltoken": NIFTY_SYMBOL_TOKEN,
        "interval": "FIVE_MINUTE",
        "fromdate": from_date,
        "todate": to_date,
    }

    resp = requests.post(ANGEL_ONE_CANDLE_URL, headers=headers, json=body, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    if data.get("status") and data.get("data"):
        return data["data"]
    else:
        print(f"   ⚠️  API returned no data: {data.get('message', 'Unknown')}")
        return []


def parse_candles(raw_candles: list) -> list:
    """
    Parse Angel One candle format into ohlc_candles rows.
    
    Angel One format: [timestamp_str, open, high, low, close, volume]
    Example: ["2026-04-18T09:15:00+05:30", 24100.5, 24125.0, 24090.0, 24110.5, 123456]
    """
    parsed = []
    seen_times = set()  # Deduplicate within the batch

    for candle in raw_candles:
        if len(candle) < 5:
            continue

        candle_time_str = candle[0]

        # Deduplicate
        if candle_time_str in seen_times:
            continue
        seen_times.add(candle_time_str)

        # Parse the timestamp to extract session_date (IST)
        try:
            dt = dateparser.parse(candle_time_str)
            session_date = dt.strftime("%Y-%m-%d")
        except Exception:
            # Fallback: extract date from string
            session_date = candle_time_str[:10]

        row = {
            "candle_time": candle_time_str,
            "open": float(candle[1]),
            "high": float(candle[2]),
            "low": float(candle[3]),
            "close": float(candle[4]),
            "volume": float(candle[5]) if len(candle) > 5 else 0,
            "symbol": "NIFTY 50",
            "timeframe": "5min",
            "session_date": session_date,
            "source": "angel_one",
        }
        parsed.append(row)

    return parsed


def upsert_to_supabase(rows: list) -> dict:
    """
    Bulk insert candles into Supabase with ON CONFLICT DO NOTHING.
    Uses the Supabase REST API with Prefer: resolution=ignore-duplicates.
    """
    if not rows:
        return {"inserted": 0, "skipped": 0}

    url = f"{SUPABASE_URL}/rest/v1/ohlc_candles"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        # This tells PostgREST to ignore duplicate key violations
        "Prefer": "resolution=ignore-duplicates,return=representation",
    }

    # Insert in chunks of 500 to avoid payload limits
    CHUNK_SIZE = 500
    total_inserted = 0
    total_skipped = 0

    for i in range(0, len(rows), CHUNK_SIZE):
        chunk = rows[i : i + CHUNK_SIZE]
        resp = requests.post(url, headers=headers, json=chunk, timeout=60)

        if resp.status_code in (200, 201):
            inserted = len(resp.json()) if resp.text else 0
            skipped = len(chunk) - inserted
            total_inserted += inserted
            total_skipped += skipped
        elif resp.status_code == 409:
            # All duplicates
            total_skipped += len(chunk)
        else:
            print(f"   ⚠️  Supabase error {resp.status_code}: {resp.text[:200]}")
            total_skipped += len(chunk)

    return {"inserted": total_inserted, "skipped": total_skipped}


def generate_date_ranges(total_days: int, batch_days: int) -> list:
    """
    Generate date ranges for API requests.
    Angel One's 5-min interval supports ~2000 candles per request.
    Each trading day has ~75 candles, so 5 days = ~375 candles (safe).
    """
    now = datetime.now()
    ranges = []

    current_end = now
    days_remaining = total_days

    while days_remaining > 0:
        days_in_batch = min(batch_days, days_remaining)
        batch_start = current_end - timedelta(days=days_in_batch)

        from_str = batch_start.strftime("%Y-%m-%d") + " 09:15"
        to_str = current_end.strftime("%Y-%m-%d") + " 15:30"

        ranges.append((from_str, to_str, days_in_batch))

        current_end = batch_start
        days_remaining -= days_in_batch

    return ranges


def print_banner():
    print()
    print("=" * 60)
    print("  ZENITH — OHLC Historical Backfill")
    print("  Fetching last 30 days of 5-min NIFTY candles")
    print("  Target: Supabase ohlc_candles table")
    print("=" * 60)
    print()


def print_summary(stats: dict):
    print()
    print("=" * 60)
    print("  BACKFILL COMPLETE")
    print("=" * 60)
    print(f"  📊 Total candles fetched:  {stats['total_fetched']}")
    print(f"  ✅ Inserted (new):         {stats['total_inserted']}")
    print(f"  ⏭️  Skipped (duplicates):   {stats['total_skipped']}")
    print(f"  📅 Date range:             {stats['start_date']} → {stats['end_date']}")
    print(f"  ⏱️  Duration:               {stats['duration']:.1f} seconds")
    print(f"  📦 API requests made:      {stats['api_requests']}")
    print("=" * 60)
    print()


def main():
    print_banner()

    # ── Step 1: Get TOTP ──
    print("📱 Step 1: Angel One Authentication")
    print("   You need to provide a TOTP code from your authenticator app.")
    print("   (This is the same TOTP used in n8n for Angel One login)")
    print()

    totp_value = input("   Enter your Angel One TOTP code: ").strip()
    if not totp_value or len(totp_value) != 6:
        print("   ❌ Invalid TOTP. Must be 6 digits.")
        sys.exit(1)

    # ── Step 2: Login ──
    jwt_token = get_angel_one_token(totp_value)

    # ── Step 3: Generate date ranges ──
    print()
    print(f"📅 Step 2: Generating date ranges ({BACKFILL_DAYS} days, {BATCH_SIZE} days/batch)")
    date_ranges = generate_date_ranges(BACKFILL_DAYS, BATCH_SIZE)
    print(f"   📦 {len(date_ranges)} API requests planned")

    # ── Step 4: Fetch & Insert ──
    print()
    print("📥 Step 3: Fetching candles and inserting into Supabase")
    print("-" * 60)

    start_time = time.time()
    stats = {
        "total_fetched": 0,
        "total_inserted": 0,
        "total_skipped": 0,
        "api_requests": 0,
        "start_date": "",
        "end_date": "",
    }

    for i, (from_date, to_date, days) in enumerate(date_ranges, 1):
        print(f"\n   [{i}/{len(date_ranges)}] {from_date} → {to_date} ({days} days)")

        # Fetch from Angel One
        try:
            raw_candles = fetch_candles(jwt_token, from_date, to_date)
            stats["api_requests"] += 1
        except Exception as e:
            print(f"   ❌ API Error: {e}")
            continue

        if not raw_candles:
            print("   ⚠️  No candles returned")
            continue

        print(f"   📊 Fetched {len(raw_candles)} candles")

        # Parse
        parsed = parse_candles(raw_candles)
        stats["total_fetched"] += len(parsed)

        # Track date range
        if parsed:
            if not stats["start_date"] or parsed[0]["session_date"] < stats["start_date"]:
                stats["start_date"] = parsed[0]["session_date"]
            if not stats["end_date"] or parsed[-1]["session_date"] > stats["end_date"]:
                stats["end_date"] = parsed[-1]["session_date"]

        # Insert into Supabase
        result = upsert_to_supabase(parsed)
        stats["total_inserted"] += result["inserted"]
        stats["total_skipped"] += result["skipped"]

        print(f"   ✅ Inserted: {result['inserted']} | Skipped: {result['skipped']}")

        # Rate limiting: Angel One allows 10 requests/second
        time.sleep(0.5)

    stats["duration"] = time.time() - start_time
    print_summary(stats)

    # ── Step 5: Verify in Supabase ──
    print("🔍 Verifying data in Supabase...")
    verify_url = f"{SUPABASE_URL}/rest/v1/ohlc_candles?select=session_date,count&order=session_date.desc&limit=10"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    # Get total count
    count_url = f"{SUPABASE_URL}/rest/v1/ohlc_candles?select=count"
    count_headers = {
        **headers,
        "Prefer": "count=exact",
    }
    count_resp = requests.head(
        f"{SUPABASE_URL}/rest/v1/ohlc_candles",
        headers=count_headers,
        timeout=10,
    )
    total_rows = count_resp.headers.get("content-range", "unknown")
    print(f"   📊 Total rows in ohlc_candles: {total_rows}")

    # Get distinct session dates
    dates_url = f"{SUPABASE_URL}/rest/v1/rpc/ohlc_summary"
    # Fallback: just get a sample
    sample_url = f"{SUPABASE_URL}/rest/v1/ohlc_candles?select=session_date,open,high,low,close,volume&order=candle_time.desc&limit=5"
    sample_resp = requests.get(sample_url, headers=headers, timeout=10)
    if sample_resp.status_code == 200:
        samples = sample_resp.json()
        print(f"   📋 Latest {len(samples)} candles:")
        for s in samples:
            print(f"      {s['session_date']} | O:{s['open']} H:{s['high']} L:{s['low']} C:{s['close']} V:{s['volume']}")

    print()
    print("🎯 Backfill complete! Your ohlc_candles table is now populated.")
    print("   Next steps:")
    print("   - Oracle Labeler can now auto-label signals using forward price data")
    print("   - Model retraining can recompute features from raw candles")
    print("   - The n8n workflow will continue adding new candles every 5 minutes")
    print()


if __name__ == "__main__":
    main()
