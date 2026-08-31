# **GROUP 3 Endpoints Tables.**

 

**Members: Nathan Chacha, Thomas Koori, Trevor Githinji, Natalie Chebet**

Repo Link: [https://github.com/n4talii/SAFEMEDS\_IAP](https://github.com/n4talii/SAFEMEDS_IAP)

    

 

| Method | Path | Purpose | Maps to Need |
| :---- | :---- | :---- | :---- |
|  GET | /tasks?status=active& sort=verifiedPharmicies |  Return a List of verified Pharmacies. |  Water Supply App needs to read a list of verified pharmacies within a specific geographical coordinate radius in order to display potential community water pickup points or cross-delivery hubs on their map. |
|  POST  |  /partner-dispatch-requests |  Create a new partner dispatch request containing delivery coordinates and order IDs |  Water suppliers App needs to create a partner dispatch request containing delivery coordinates and order IDs in order to allow shared courier services to deliver both bottled water and prescribed medication in a single trip. |
|  POST  |  /payments/stk-push |  Triggers an Mpesa STK push so customers can pay for deliveries |  Water Supply App needs to create payment requests to users–this allows users to pay for deliveries. |
|  GET |  /dispatch-requests/{id}/ |  Retrieve the status and details of a specific dispatch request | |  The Water Suppliers App needs to create a partner dispatch request..." (Added to track created requests)  |
|  PATCH |  orders/{id} |  Update delivery status to delivered |  The Water Suppliers App needs to reflect on what customers orders have been delivered  |
|   |   |   |   |

 

## **Review from group 1\.**

**1\. First endpoint resource is wrong: /tasks does not match the purpose of retrieving pharmacies. Use /pharmacies.**

**2\. Use query parameters correctly: sort=verifiedPharmacies should be a filter such as verified=true. Also include coordinates/radius since the need mentions location.**

**3\. Keep endpoint naming consistent: Use clear plural resource names such as /dispatch-requests, /payment-requests, and /orders.**

# **Corrected table**

# **GROUP 3 Endpoints Tables.**

 

Members: Nathan Chacha, Thomas Koori, Trevor Githinji, Natalie Chebet

Repo Link: [https://github.com/n4talii/SAFEMEDS\_IAP](https://github.com/n4talii/SAFEMEDS_IAP)

 

   

 

| Method | Path | Purpose | Maps to Need |
| :---- | :---- | :---- | :---- |
|  GET | /pharmacies?verified=true\&lat={lat}\&lng={lng}\&radius={km} |  Return a List of verified Pharmacies. |  Water Supply App needs to read a list of verified pharmacies within a specific geographical coordinate radius in order to display potential community water pickup points or cross-delivery hubs on their map. |
|  POST  |  /partner-dispatch-requests |  Create a new partner dispatch request containing delivery coordinates and order IDs |  Water suppliers App needs to create a partner dispatch request containing delivery coordinates and order IDs in order to allow shared courier services to deliver both bottled water and prescribed medication in a single trip. |
|  POST  |  /payments/stk-push |  Triggers an Mpesa STK push so customers can pay for deliveries |  Water Supply App needs to create payment requests to users–this allows users to pay for deliveries. |
|  GET |  /dispatch-requests/{id} |  Retrieve the status and details of a specific dispatch request | |  The Water Suppliers App needs to create a partner dispatch request..." (Added to track created requests)  |
|  PATCH |  /orders/{id} |  Update delivery status to delivered |  The Water Suppliers App needs to reflect on what customers orders have been delivered  |
|   |   |   |   |

 

**CORRECTIONS WERE ON ROW 1, 4 AND 5**

