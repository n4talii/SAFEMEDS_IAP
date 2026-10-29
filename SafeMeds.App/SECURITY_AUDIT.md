# Security Audit Report

## 1. Audit Checklist & Findings

- **Sensitive Data Exposure:** Verified that raw database rows are never returned. All endpoints explicitly construct response objects to avoid exposing internal fields or hashes.
- **Unauthorized Data Access:** Verified that callers cannot query or manipulate private user records by manipulating IDs.
- **Error Messages:** Inspected database failure handlers. Confirmed that internal error details are logged server-side while returning generic, safe JSON messages to callers.
- **Mass Assignment:** Audited `POST /orders`. Payloads are strictly validated (`productId` must be a number, `quantity` > 0) and mapped explicitly into insert statements, preventing field injection.
- **Key Exposure:** Verified that `.env` is in `.gitignore` and no real API keys are hardcoded in source files or `README.md`.

## 2. Rate Limit Justification

- **Threshold Chosen:** 100 requests per minute per API key (`windowMs: 60000`, `max: 100`).
- **Justification:** This threshold provides ample throughput for normal consumer application usage and legitimate frontend polling while protecting the server against brute-force attempts and runaway client loops.
