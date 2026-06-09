# Data Residency Controls Architecture

## Overview

The data residency controls system ensures FaxNova backend complies with regional data sovereignty requirements by:

1. **Zone-based routing** — Routes requests and data to providers/storage aligned with residency zones
2. **Provider constraints** — Enforces provider availability per zone
3. **Storage isolation** — Partitions logs and data by residency zone
4. **Compliance tracking** — Logs all residency decisions for audit trails

## Architecture Components

### 1. Residency Policy Engine (`src/residency/policy.js`)

Defines and manages residency zones and their constraints.

**Zones:**
- `us-east-tribal`: US tribal data, any US provider (Sinch, Telnyx)
- `eu-sovereign`: EU GDPR data, EU providers only (Telnyx)
- `global`: Non-restricted data, all providers available

**Key Functions:**
- `getResidencyZone(countryCode)` — Maps country to zone
- `isProviderAllowed(zone, provider)` — Checks provider availability in zone
- `getProvidersForZone(zone)` — Lists allowed providers

### 2. Residency Guard Middleware (`src/middleware/residencyGuard.js`)

Attaches residency context to HTTP requests.

**How it works:**
1. Reads country from `x-country` header (or implements GeoIP lookup)
2. Calls `getResidencyZone()` to determine zone
3. Attaches `req.residencyZone` and `req.residencyCountry` to request
4. All downstream handlers can access residency context

**Usage:**
```javascript
router.post("/fax/send", residencyGuard, async (req, res) => {
  // req.residencyZone is available
});
```

**Advanced Constraints:**
- `requireZone(zone)` — Enforce specific zone
- `requireZones(...zones)` — Enforce multiple allowed zones

### 3. Residency-Aware Storage (`src/storage/residencyStorage.js`)

Routes all file writes to zone-specific directories.

**Directory Structure:**
```
data/
  ├── us-east-tribal/
  │   ├── audit.log
  │   ├── requests.json
  │   └── ...
  ├── eu-sovereign/
  │   ├── audit.log
  │   └── ...
  └── global/
      └── ...
```

**Key Functions:**
- `getResidencyPath(zone)` — Get zone directory
- `writeResidencyLog(zone, filename, line)` — Append to log
- `readResidencyLog(zone, filename)` — Read log
- `writeResidencyJSON(zone, filename, data)` — Write JSON
- `readResidencyJSON(zone, filename)` — Read JSON

### 4. Residency-Aware Provider Router (`src/services/providerRouter.js`)

Routes fax delivery through residency-compliant providers.

**Flow:**
1. Check if primary provider is allowed in zone
2. If allowed and healthy, use primary provider
3. If primary fails or disallowed, try fallback providers
4. Only use providers allowed in the zone
5. Return routing metadata for audit trail

**Response Metadata:**
```javascript
{
  faxId: "123",
  status: "sent",
  primaryProvider: "sinch",
  fallbackProvider: null,
  residencyZone: "us-east-tribal",
  failoverUsed: false
}
```

## Integration Points

### In Routes (e.g., `routes/faxRoutes.js`)

```javascript
import { residencyGuard } from "../middleware/residencyGuard.js";
import { sendFax } from "../controllers/faxController.js";

router.post("/send", tribalAuth, residencyGuard, async (req, res) => {
  try {
    const result = await sendFax(req.body, req.residencyZone);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### In Services (e.g., `services/faxService.js`)

```javascript
import { routeFax } from "./providerRouter.js";
import { writeResidencyLog } from "../storage/residencyStorage.js";

export async function sendFax(payload, zone) {
  const result = await routeFax(payload, zone);
  
  // Log the action
  writeResidencyLog(zone, "fax-deliveries.log", JSON.stringify({
    faxId: result.faxId,
    timestamp: new Date().toISOString(),
    provider: result.primaryProvider,
    zone
  }));
  
  return result;
}
```

### In Agents (e.g., `agents/auditAgent.js`)

```javascript
import { writeResidencyLog } from "../storage/residencyStorage.js";

export async function auditFax(faxId, zone) {
  const audit = {
    faxId,
    timestamp: new Date().toISOString(),
    notes: "Audit complete"
  };
  writeResidencyLog(zone, "audit.log", JSON.stringify(audit));
}
```

## Environment Variables

```bash
# Storage base path (defaults to ./data)
RESIDENCY_STORAGE_BASE=/var/lib/faxnova/data

# Debug logging
DEBUG_RESIDENCY=true
```

## Compliance & Audit Trail

Every request logs:
- Residency zone detected
- Provider selected
- Failover events
- Storage location

This creates an auditable trail for compliance reviews:
- GDPR: EU data routed only to EU providers
- HIPAA: Sensitive data isolated in compliant zones
- SOC 2: All decisions logged and traceable

## Future Enhancements

1. **Real GeoIP Integration** — Replace header-based detection with MaxMind/IP2Location
2. **Multi-Region Database** — Zone-partitioned MongoDB deployments
3. **DLP (Data Loss Prevention)** — Block transfers across zones
4. **Compliance Reporting** — Auto-generate compliance reports by zone
5. **Dynamic Zone Configuration** — Update zones via API without redeployment
6. **Provider Health Monitoring** — Per-zone provider health checks
7. **Cross-Zone Consent** — Explicit consent for cross-zone operations
