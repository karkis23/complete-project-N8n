# Session Update: Dhan Order Execution & Sandbox Fixes

**Date:** April 14, 2026  
**Focus:** n8n Data Pipeline, Broker API Integration (Dhan), JSON Schema Compliance  

## Summary of Changes
This session focused entirely on resolving order rejection errors and `502 Bad Gateway` crashes occurring in the n8n Dhan Sandbox order placement workflow.

### 1. Dynamic Security ID Retrieval & Type Strictness
Initially, the `securityId` was mapped from the `NIFTY Option Chain Builder1` node. We updated the logic to fetch the `security_id` dynamically straight from the live option chain broadcast (`Option Chain Request1`) to ensure up-to-the-second broker synchronization.
- **Fix Applied:** Modified the `Prepare Dhan Order` JavaScript node to grab `liveSide.security_id` explicitly.
- **Type Casting:** For Option ID numbers, the Dhan JSON API requires a strict string representation. We patched the node to enforce string interpolation:
  ```javascript
  // Enforcing strict string casting so the JSON parser does not default to Number
  securityId: `${selectedOption.securityCode}`
  ```

### 2. Resolution of 502 Bad Gateway errors in Sandbox
The HTTP Request node (`Place Entry Order1`) for the Dhan Sandbox environment was throwing a `502 Bad Gateway`. After auditing the JSON payload against Dhan's expected standard interface, we discovered that Dhan requires *all* fields defined in their backend schema to be initialized, or the broker's auto-unmarshaler will encounter missing keys and crash processing the request.
- **Fix Applied:** We updated the `Place Entry Order1` JSON body expression to include 7 missing default fields explicitly initialized to zero or false:
  ```json
  "disclosedQuantity": 0,
  "price": 0,
  "triggerPrice": 0,
  "afterMarketOrder": false,
  "amoTime": "OPEN",
  "boProfitValue": 0,
  "boStopLossValue": 0
  ```
- **Outcome:** Fleshing out the full JSON object ensures the endpoint routing properly validates MARKET orders without backend crashes.

### 3. Dhan Sandbox API Deprecation Discovery
During testing, after fully strictly formatting the JSON payload, we verified that the `502 Bad Gateway` error persisted. It was ultimately discovered that **Dhan has officially deprecated and removed the public Sandbox API environment (`https://sandbox.dhan.co`)**. 
- The Sandbox playground is no longer available.
- The `502` error natively reflected the server routing endpoint being completely offline, not necessarily our payload schema.

## Current System State
- The n8n workflow for order placement now successfully wraps its variable bindings as proper types (Strings for IDs, Integers for quantities) and provides a fully-compliant JSON dictionary format.
- **Action Required:** We must migrate the HTTP Request node endpoint from `https://sandbox.dhan.co/v2/orders` to the live production endpoint `https://api.dhan.co/v2/orders` to achieve order execution capabilities.
