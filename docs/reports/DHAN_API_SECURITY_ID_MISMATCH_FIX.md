# Issue Resolution: Dhan API Security ID Mismatch

**Date**: April 10, 2026
**Issue Category**: Broker Integration / Order Execution (Dhan API)

## The Problem
During recent sandbox ordering testing, a critical bug was identified where live orders for `NIFTY` indices were being REJECTED by the broker API. 

The investigation revealed that an override was manually implemented in the "Prepare Dhan Order" (or equivalent node) to force-sync the `securityId` from the **Live Dhan Option Chain Request**. However, the Live Option Chain API can sometimes return outdated or mismatching `security_id` integers (e.g., `54816` mapped for BankNifty / misaligned NIFTY mapping), conflicting with the current active instrument master CSV.

### The Symptom
- Order `exchangeSegment`: `NSE_FNO`
- Order Type: `INTRADAY MARKET`
- Output Trading Symbol mapping failed. The system attempted to pass the overridden and conflicting security ID representing the wrong instrument instead of the correctly resolved master contract string. 

## The Fix
The logic in the Javascript builder node was revised so that it **only updates the Last Traded Price (LTP)** from the Live Option Chain and strictly relies on the **Master CSV mapping** from the `NIFTY Option Chain Builder1` node for the `securityCode`.

### Old Logic (Buggy)
```javascript
// ✅ OVERRIDE THE MISMATCHING ID WITH THE LIVE ONE
if (liveSide) {
    selectedOption.ltp = liveSide.last_price || 0;
    selectedOption.securityCode = liveSide.security_id.toString(); // ❌ THIS CAUSED THE MISMATCH
}
```

### New Logic (Fixed)
```javascript
if (liveSide) {
    // ✅ Keep the verified Security ID provided by the Builder/Master CSV
    // ✅ Sync ONLY the LTP
    selectedOption.ltp = liveSide.last_price || 0;
}

// 6. Build Order uses verified Master ID
const dhanOrder = {
    // ...
    securityId: selectedOption.securityCode.toString(),  
    // ...
};
```

## Why This Matters
For Option contracts, brokers refresh their token mappings (`securityId`) daily or weekly based on expiry shifts. The Live option chain endpoint sometimes trails parsing updates or bundles multiple expiries causing fuzzy cross-pollution. Fetching the underlying Option Token directly via strict strike/type lookup against the day’s instrument master CSV guarantees the right contract token is transmitted to the broker for execution.
