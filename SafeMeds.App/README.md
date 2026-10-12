# SafeMeds Cross-Team API

SafeMeds provides MajiApp with water-purification inventory, product ratings, anonymized waterborne-illness alerts, and verified providers near a map coordinate. Pharmacies and health experts share the `/providers` resource and are selected with the `type` query parameter.

## API documentation

The browsable API reference is in [`docs/index.html`](docs/index.html), generated from [`openapi.yaml`](openapi.yaml). It documents six operations across five paths: five MajiApp use cases and the Week 6 stock-update PATCH. Locally, open `http://localhost:5000/docs/`. To publish it, set GitHub Pages to the repository root and open `/docs/`.

## Authentication

The contract does not require an API key, bearer token, or other authentication. The local demo server does not enforce authentication.

## Run locally

Requirements: Node.js 18 or later and npm.

From a clean clone, open a terminal in `SafeMeds.App` and run:

```powershell
npm install
npm run server
```

Leave that terminal running. The API health endpoint is `http://localhost:5000/api`. In a second PowerShell terminal, run the quickstart request:

```powershell
curl.exe --fail-with-body "http://localhost:5000/api/inventory?product=chlorine-tablets&available=true"
```

The server uses bundled in-memory demonstration records, so no database credentials or `.env` file are needed. These records are for the lab demo and are not live MySQL data. A stock PATCH changes the in-memory quantity until the server restarts.

## Endpoints

### Water-purification inventory

```powershell
curl.exe --fail-with-body "http://localhost:5000/api/inventory?product=chlorine-tablets&available=true"
```

Response:

```json
[
  {
    "productId": 100102,
    "productName": "Chlorine Tablets 100mg",
    "availableQuantity": 450,
    "isAvailable": true
  }
]
```

### Water-purification ratings

`sort` accepts `rating` or `name`.

```powershell
curl.exe --fail-with-body "http://localhost:5000/api/products/water-purification?sort=rating"
```

Response:

```json
[
  {
    "productId": 100102,
    "productName": "AquaClean Purification Drops",
    "averageRating": 4.8,
    "reviewCount": 124
  }
]
```

### Waterborne-illness alerts

`since` must be a date in `YYYY-MM-DD` format.

```powershell
curl.exe --fail-with-body "http://localhost:5000/api/health-signals/area-alerts?region=eastern-district&since=2026-08-01"
```

Response:

```json
[
  {
    "alertId": "alt-8812",
    "region": "eastern-district",
    "illnessType": "Cholera",
    "severity": "high",
    "detectedAt": "2026-08-13T10:00:00Z"
  }
]
```

### Nearby verified providers

Use `type=pharmacy` for pharmacies or `type=health_expert` for health professionals. `radius` is measured in kilometres.

```powershell
curl.exe --fail-with-body "http://localhost:5000/api/providers?type=pharmacy&status=verified&lat=-1.286389&lng=36.817223&radius=5"
```

Response:

```json
[
  {
    "providerId": "vnd-109",
    "name": "SafeCare Pharmacy",
    "type": "pharmacy",
    "status": "verified",
    "address": "123 Commercial St, Nairobi"
  }
]
```

For a health expert:

```powershell
curl.exe --fail-with-body "http://localhost:5000/api/providers?type=health_expert&status=verified&lat=-1.286389&lng=36.817223&radius=10"
```

Response:

```json
[
  {
    "providerId": "exp-302",
    "name": "Dr. Jane Wanjiku",
    "type": "health_expert",
    "status": "verified",
    "specialty": "Water Sanitation Specialist",
    "phone": "+254712345678"
  }
]
```

### Update medication stock

The Week 6 PATCH accepts a non-negative integer `stockQuantity`.

```powershell
curl.exe --fail-with-body -X PATCH -H "Content-Type: application/json" -d '{"stockQuantity":350}' "http://localhost:5000/api/medications/100102/stock"
```

Response:

```json
{
  "productId": 100102,
  "productName": "Chlorine Tablets 100mg",
  "stockQuantity": 350,
  "productCategory": "water-purification"
}
```

## Error responses

Errors use HTTP status codes and a JSON object with a `message` field. Invalid parameters or payloads return `400`; an unknown medication ID returns `404`.

```json
{
  "message": "stockQuantity must be an integer greater than or equal to 0."
}
```

## Contract notes

- `/providers` requires `type`, `status=verified`, `lat`, `lng`, and a positive `radius`.
- Alerts contain no patient identifiers.
- The local demo server provides example responses so the quickstart can be followed from a clean clone. It does not connect to the supplied MySQL database.
