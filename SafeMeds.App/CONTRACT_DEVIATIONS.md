This is for week 5 Activity.

Repo Link: [https://github.com/n4talii/SAFEMEDS_IAP](https://github.com/n4talii/SAFEMEDS_IAP)

All the End points work as planned.

NO DEVIATIONS.

# **This is for week 6 activity.**

## **Repo Link: [https://github.com/n4talii/SAFEMEDS_IAP](https://github.com/n4talii/SAFEMEDS_IAP)**

\- During this week 6 activity all the GET Endpoints were reviewed.  
\- The ones reviewed were:  
\- | GET | /inventory?product=chlorine-tablets\\\&available=true | Return available water-purification products, such as chlorine tablets, from the inventory. | MajiApp needs to read the inventory data in order to see if water purification meds are available and display that data to their suppliers |  
\- | GET | /products/water-purification?sort=rating | Return water-purification products together with their customer ratings/reviews, ordered by rating. | MajiApp needs to read customer reviews and ratings in order to suggest the best and safest water-purification products to use when purifying water and suggest the same to their suppliers. |

\- They needed their status codes to be updated. They were set to status code 400 for both End points in the API_CONTRACT.

\- Then we also added one more end point after a brief meeting with our down stream partners. The new end point is a PATCH. Upon testing it worked well. The only thing that needed to be updated were the status codes as well.

> > > o 200 – For a Successful update of the stock e.g. Stock update from 200 to 300  
> > > o 400 – For Invalid Payload or missing required fields from the client side.  
> > > o 404 – Medication to be updated not found. E.g. Wrong Medication ID entered.

## Additional deviations identified during the Week 8 review

- The Week 6 PATCH remains the team's one non-GET endpoint. Natalie confirmed that this endpoint was discussed with Jeremy from Group 4 and is the PATCH to submit.
- The original Week 6 implementation used `PATCH /api/inventory/{id}` with a `stock` field and a different response shape. The Week 8 local demo now exposes the agreed `PATCH /api/medications/{id}/stock` contract with `stockQuantity`, the documented success response, and `message` errors.
- The local demo uses in-memory records so a clean clone can run without secrets. It does not persist changes or read the supplied MySQL schema; stock resets when the server restarts. Connecting this contract to the MySQL database remains a data-integration deviation.
