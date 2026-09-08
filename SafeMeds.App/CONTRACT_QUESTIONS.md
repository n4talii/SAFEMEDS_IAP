1. Missing Contact Details (email Field)
   • Endpoint: GET /pharmacies & GET /pharmacies/{id}/location
   • Issue: Our integration requires a pharmacy email address so users can contact the nearest location directly. Neither the POST /pharmacies request body nor the GET /pharmacies response schemas include an email field.
   • Question: Could you add an optional email property (type: string, format: email) to the pharmacy response object so we can surface contact info on our landing page map?
2. Lack of Search & Radius Parameters for Nearest-Pharmacy Query
   • Endpoint: GET /pharmacies
   • Issue: Our core feature requires users to search for specific medications near their coordinates (e.g., "ping the nearest pharmacy close to them"). Currently, GET /pharmacies only accepts a fields parameter and returns all records without geographic (lat, lng, radius) or medication name filtering.
   • Question: How should we query for pharmacies that carry a specific medication within a given distance? Can query parameters like medicationName, lat, lng, and radius be added to GET /pharmacies?
3. Mismatched Response Schema for GET /pharmacies vs. Medication Pricing
   • Endpoint: GET /pharmacies
   • Issue: The GET /pharmacies response schema returns a stock array containing medicationName and quantity, but it completely omits the medication price. Additionally, the parameter definition accepts enum: [stock, name, location, medications, price], creating an inconsistency between the query options and the response payload.
   • Question: If we pass fields=medications or fields=price, will the response include the full medication object with its price, or can the stock array schema be updated to include price alongside quantity?
