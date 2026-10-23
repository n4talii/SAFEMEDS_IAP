# SafeMeds API — MajiApp Integration

SafeMeds exposes a hosted API for MajiApp to check water-purification inventory, product ratings, area alerts, and verified pharmacies or health experts.

## API reference

Open the interactive documentation at [safemeds-iap-api.onrender.com/docs](https://safemeds-iap-api.onrender.com/docs/).

**Base URL:** `https://safemeds-iap-api.onrender.com/api`

No API key or bearer token is required for this lab demo.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/inventory?product=chlorine-tablets&available=true` | Find available chlorine tablets. |
| GET | `/products/water-purification?sort=rating` | List water-purification products by rating. |
| GET | `/health-signals/area-alerts?region={region}&since={date}` | Find anonymized illness alerts for a region since a date. |
| GET | `/providers?type=health_expert&status=verified&lat={lat}&lng={lng}&radius={km}` | Find verified health experts near a coordinate. |
| GET | `/providers?type=pharmacy&status=verified&lat={lat}&lng={lng}&radius={km}` | Find verified pharmacies near a coordinate. |
| PATCH | `/medications/{id}/stock` | Update the available stock quantity. |

The provider `radius` is in kilometres. The alert `since` date uses `YYYY-MM-DD`.

## Quick examples

```powershell
curl.exe --fail-with-body "https://safemeds-iap-api.onrender.com/api/inventory?product=chlorine-tablets&available=true"
```

```powershell
curl.exe --fail-with-body "https://safemeds-iap-api.onrender.com/api/providers?type=pharmacy&status=verified&lat=-1.286389&lng=36.817223&radius=5"
```

```powershell
curl.exe --fail-with-body -X PATCH -H "Content-Type: application/json" -d '{"stockQuantity":350}' "https://safemeds-iap-api.onrender.com/api/medications/100102/stock"
```

## Demo data

The hosted lab service uses demonstration records and does not connect to the supplied MySQL database. Stock updates are held in memory and may reset when the service restarts. A free Render instance may take longer to respond after inactivity.

## Blind test

A teammate followed this README from a clean clone and received a working response in two minutes, without database setup. They reported that all example requests matched the documented responses. See the [Week 8 blind test report](SafeMeds.App/BLIND_TEST_REPORT.md).
