**_ Running the APIs _**

`Consumer APIs`

`The consumer commands should be run on powershell`

### Command 1

curl.exe -s "https://meditrac-api.onrender.com/api/medications/search?name=Amoxicillin" `
-H "X-API-Key: <API-Key>"

### Command 2

curl.exe -s "https://meditrac-api.onrender.com/api/medications/search?name=Paracetamol&lat=-1.2833&lng=36.8219&radius_km=5&in_stock=true" `
-H "X-API-Key: <API-Key>"

### Command 3

curl.exe -s "https://meditrac-api.onrender.com/api/medications/mine" `  -H "X-API-Key: <API-Key>"`
-H "Authorization: Bearer <Bearer-Token>"

### Command 4

curl.exe -s "https://meditrac-api.onrender.com/api/medications" `
-H "X-API-Key: <API-Key>"

### Versoning Command

curl.exe -s "https://meditrac-api.onrender.com/api/v2/medications" `
-H "X-API-Key: <API-Key>"

`Producer APIs`

`The Producer commands should be run on CMD`

### 1. Inventory endpoint

curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/inventory"

### 2. Reviews endpoint

curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/reviews"

### 3. Orders endpoint

curl -i -X POST "https://safemeds-majiapp-api-nate.onrender.com/orders" -H "X-API-Key: <API-Key>" -H "Content-Type: application/json" -d "{\"productId\": <YOUR_ID>, \"quantity\": <YOUR_QUANTITY>, \"customerName\": \"<YOUR_CUSTOMER_NAME>\"}"

### 4. Health Signals endpoint

curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/v1/health-signals/area-alerts?region=Nairobi&since=2026-10-25"

`Commands for the versoning Lab`

### 1. Start Your Server

`npm start`

### 2. Test All Three Response Shapes

```
curl -s -H "X-API-Key: <API-Key>" http://localhost:3000/v1/reviews
curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/v1/reviews"

curl -s -H "X-API-Key: <API-Key>" http://localhost:3000/v2/reviews
curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/v2/reviews"

curl -s -H "X-API-Key: <API-Key>" http://localhost:3000/reviews
curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/reviews"
```

### 3. Verify v1 Is Unchanged

curl -s -H "X-API-Key: <API-Key>" http://localhost:3000/reviews > v1_after.json
fc v1_before.json v1_after.json

### 4. Verify Deprecation Headers (v1 vs v2)

curl -si -H "X-API-Key: <API-Key>" http://localhost:3000/reviews | findstr /I "HTTP Deprecation Sunset Link"

curl -si -H "X-API-Key: <API-Key>" http://localhost:3000/v1/reviews | findstr /I "HTTP Deprecation Sunset Link"

curl -si -H "X-API-Key: <API-Key>" http://localhost:3000/v2/reviews | findstr /I "HTTP Deprecation Sunset Link"

### 5. Verify API Key Protection on v2 (Checklist)

curl -si http://localhost:3000/v2/reviews | findstr /I "HTTP message"

### 6. Run Automated Jest Suite

`npm test`

### 7. Check /stats Route Logs

curl -s -H "X-API-Key: <API-Key>" http://localhost:3000/stats

curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/reviews"

curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/v1/reviews"

curl -i -H "X-API-Key: <API-Key>" "https://safemeds-majiapp-api-nate.onrender.com/v2/reviews"

`Commands for the Monitoring Lab`

## 1. Start up

npm start

## 2. Generate Simulated Traffic

set API=http://localhost:3000
set KEY=<API-Key>
node traffic.js

## 3. Check Metrics [/stats]

`Local Server`
curl -s -H "X-API-Key: <API-Key>" http://localhost:3000/stats

`Live Render Server`
curl -s -H "X-API-Key: <API-Key>" https://safemeds-majiapp-api-nate.onrender.com/stats

### Rate Limiting Command

`Local Testing`

set API=http://localhost:3000
set KEY=<API-Key>
set N=200
node traffic.js

`Render Testing `
set API=https://safemeds-majiapp-api-nate.onrender.com
set KEY=<API-Key>
set N=200
node traffic.js
