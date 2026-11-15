# MediTrac Integration - GET, POST and FAIL Demo Guide


---

## 0. Before you start

- Use **PowerShell** and always type `curl.exe` (not `curl`, which is an alias for a different command in Windows PowerShell).
- Use straight quotes (`"`) and plain hyphens (`-i`, `-X`, `-H`, `-d`). Curly quotes and en dashes break the commands.
- PowerShell variables are **lost when you close the window**. Set them again at the start of every new terminal session.

---

## 1. Set up variables (every new terminal window)

Replace `YOUR_API_KEY` with the key issued to you. Do this step with the terminal minimized.

```powershell
$API = "https://meditrac-api.onrender.com"
$KEY = "YOUR_API_KEY"
$dir = "C:\Users\...\SafeMeds.App"
$loginPath = "$dir\login.json"
$stockPath = "$dir\stock.json"
```

Check they are set (without printing the key):

```powershell
"API=[$API]"
"KEY length=$($KEY.Length)"
```

Expected: the URL, and a key length of 52. If either is empty, the commands below will fail with `URL rejected: No host present`.

---

## 2. Warm up the server (10-15 minutes before the demo)

MediTrac runs on Render's free tier and sleeps after inactivity. The first request can take about 60 seconds.

```powershell
curl.exe -sS -i "$API/api/medications/mine" -H "X-API-Key: $KEY"
```

A reply of `{"error":"Please log in as a pharmacy first."}` is **normal**. It means the server is awake (this request has no login token).

---

## 3. Create login.json

Create the file with PowerShell so the encoding is correct. Replace `YOUR_EMAIL` and `YOUR_PASSWORD` with the real Wellness Pharmacy account details (no angle brackets).

```powershell
'{ "accountType": "pharmacy", "email": "YOUR_EMAIL", "password": "YOUR_PASSWORD" }' | Out-File -Encoding ascii $loginPath
Test-Path $loginPath
```

`Test-Path` must print `True`.

---

## 4. Create stock.json

This is the stock data sent in the POST. Edit the medicines to match your own. Use `-` instead of the bullet character in `form`, which can get garbled when saved.

```powershell
@'
{
  "medications": [
    {
      "sku": "ZDI-200",
      "name": "Mara Moja",
      "form": "Tablets - 10x15 pack",
      "category": "Analgesic / Pain Relief",
      "quantity": 67,
      "unit": "Boxes",
      "price": 20,
      "branch": "CBD Branch"
    },
    {
      "sku": "TWS-456",
      "name": "Multi-Usage",
      "form": "Capsules - 5x10 pack",
      "category": "Antibiotic",
      "quantity": 67,
      "unit": "Boxes",
      "price": 400,
      "branch": "CBD Branch"
    },
    {
      "sku": "RED-678",
      "name": "Kaluma Strong",
      "form": "Inhaler - 100 doses",
      "category": "Respiratory",
      "quantity": 67,
      "unit": "Inhalers",
      "price": 300,
      "branch": "CBD Branch"
    }
  ]
}
'@ | Out-File -Encoding ascii $stockPath
Test-Path $stockPath
```

`Test-Path` must print `True`. If `stock.json` already exists and you want to keep it, skip this step.

---

## 5. Log in and get a token

The token is a temporary pass (about 7 days) that proves you are logged in as the pharmacy. A new one is generated on every login.

```powershell
$r = curl.exe -sS -X POST "$API/api/auth/login" `
  -H "X-API-Key: $KEY" `
  -H "Content-Type: application/json" `
  -d "@$loginPath" | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($r.token)) {
  "No token returned. Login response:"
  $r | ConvertTo-Json -Depth 5
} else {
  $TOKEN = $r.token
  "Login returned a token (not displayed)."
}
```

Expected: `Login returned a token (not displayed).`

Check the token is stored (length only):

```powershell
"TOKEN length=$($TOKEN.Length)"
```

---

## 6. GET - Read current stock

Returns only the listings belonging to the pharmacy you logged in as ("mine").

```powershell
curl.exe -sS -i "$API/api/medications/mine" -H "X-API-Key: $KEY" -H "Authorization: Bearer $TOKEN"
```

**What to say:** "We are calling MediTrac's API to see the current stock Wellness Pharmacy has listed. These are the medications patients can find when they search."

---

## 7. POST - Push stock to MediTrac

Endpoint: `POST https://meditrac-api.onrender.com/api/medications/bulk`

```powershell
curl.exe -sS -i -X POST "$API/api/medications/bulk" `
  -H "X-API-Key: $KEY" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d "@$stockPath"
```

Expected: `HTTP/1.1 200` or `201` with a body like:

```json
{ "created": 3, "updated": 0, "results": [ ... ] }
```

If the items already exist, you will see `"updated": 3` instead. This is fine, the call is idempotent.

Run the GET command from step 6 again to confirm the new items appear.

**What to say:** "SafeMeds acts as the pharmacy's system. When a pharmacist updates stock on our dashboard, this call syncs it upstream, and MediTrac makes it searchable for patients."

---

## 8. FAIL - Intentional 401

Same POST, but with a wrong API key. Do **not** use `$KEY` here.

```powershell
curl.exe -sS -i -X POST "$API/api/medications/bulk" `
  -H "X-API-Key: WrongKey123" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d "@$stockPath"
```

Expected:

```
HTTP/1.1 401 Unauthorized
{"message":"Missing or invalid API key"}
```

**What to say:** "If a system calls MediTrac with an invalid API key, it is rejected immediately with a 401 Unauthorized. This is how MediTrac protects pharmacy data from unauthorized writes."

---

## 9. Optional - Update one item's quantity (PATCH)

Take the `id` of the item from the GET response and replace `LISTING_ID`:

```powershell
curl.exe -sS -i -X PATCH "$API/api/medications/LISTING_ID/stock" `
  -H "X-API-Key: $KEY" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d "{\"quantity\": 9}"
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `URL rejected: No host present` | `$API` is empty | Re-run step 1 in this window |
| `curl: Failed to open` / error reading file with `-d` | `$stockPath` or `$loginPath` is empty or the file is missing | Re-run step 1, then check with `Test-Path` |
| `Please log in as a pharmacy first` | No token sent, or `$TOKEN` is empty | Run step 5 (login) |
| `No token returned` on login | Wrong email or password, bad JSON, or server still waking | Check `login.json`, wait 60s and retry |
| `400` | Invalid JSON or missing fields | Check `stock.json` (replace bullet characters with `-`) |
| `401` | Wrong API key, or expired token | Check `$KEY` length (52), re-run login |
| `409` | SKU already exists | Use PATCH to update quantity instead |
| `429` | Rate limited (100 req/min) | Wait the `Retry-After` seconds |
| `5xx` or timeout | Render cold start | Wait 60s and retry |

---

## Pre-demo checklist

- [ ] Set variables (step 1) in the window you will present from
- [ ] Create `login.json` and `stock.json` (steps 3 and 4)
- [ ] Warm up the server (step 2) and wait for a response
- [ ] Log in (step 5) and confirm `TOKEN length` is not 0
- [ ] Dry run: GET, POST, GET again, FAIL
- [ ] Minimize the terminal whenever the API key is typed or pasted
- [ ] Keep the API key, password and token out of GitHub