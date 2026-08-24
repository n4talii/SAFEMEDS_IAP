# **Internet Application Programming Week 1 Lab**

repo link : https://github.com/n4talii/SAFEMEDS_IAP.git

## **Charter Document for Group 3\.**

### **Project Purpose and Scope**

\-            The application provides convenience to users when they want to lookup medication to avoid going to pharmacies only to find the stock is not available so that they can make an informed decision early.  
\-            The application as well provides solid tools that pharmacies can use to monitor, update and preview their Inventory. It also provides safe and easy Inventory management and maintenance.

### **Roles and Responsibilities**

1\.        Docs/DevOps Lead – Natalie Chebet Meresey (194587)  
2\.        Integration/QA Lead – Chacha Mogaya Nathan \[197929\]  
3\.        API Lead – Koori Thomas Njue  \[218891\]  
4\.        BackendDevOp – Trevor Ndung’u Githinji

### **Communication Norms**

1\.        WhatsApp  
2\.        Gmail

### **Deadlines and Milestones**

\-            Our target is to meet the weekly threshold of having our API ready to be consumed on every lab day \[Fridays\].  
\-            This is without any delays to not inconvenience other teams.

### **Conflict Resolution and Accountability**

\-            Technical disagreements shall be handled via conversations between group members and review of work. Missed deadlines shall be handled by the instructor.

 

## **Application Summary.**

**SafeMeds** is a comprehensive pharmaceutical management application designed to streamline pharmacy operations, inventory tracking, and inter-service communication. The platform provides real-time monitoring of critical supply metrics, highlighting stock levels, reorder thresholds, and active prescription fulfillment.

Through its modular dashboard architecture, SafeMeds manages medication cataloguing, SKU classification, customer feedback ratings, and operational alerts. Built to enable seamless integration across healthcare and retail ecosystems, the application serves as an interoperable communication hub that exposes and consumes REST APIs for automated stock synchronization, third-party order processing, and supplier coordination.

 

 

 

**OUR API WILL BE CONSUMED BY GROUP 4 AND WE WILL CONSUME OUR API FROM GROUP 2**

 

 

 **TEAM MEMBERS AUDIT**

## **Dashboard Page. – Nathan**

The **SafeMeds Dashboard Overview** functions as the central administrative and inventory monitoring hub for our pharmaceutical management platform. It provides real-time visibility into vital operational metrics, including total medication counts, daily received orders, and critical low-stock threshold alerts to prevent supply chain bottlenecks.

The core feature is the **Inventory Management** console, which tracks medication records, SKU identifiers, stock levels, reorder points, and safety compliance ratings. Additionally, the dashboard integrates operational notification feeds and live customer ratings, serving as an interoperable communication hub designed to expose and consume REST APIs for cross-system stock synchronization, order fulfillment, and client feedback.

**I still need to review the page before I provide any APIs, methods or Purposes.**

 

**Home Landing Page APIs that are needed \- Natalie**

| APIs | Method  | Purpose  |
| :---- | :---- | :---- |
| /api/medicines?search={query}  | GET | Search medicines by name  |
| /api/pharmacies?lat={lat}\&lng={lng}\&radius={radius}  | GET | Get nearby pharmacies within radius  |
| /api/pharmacies?search={query}  | GET  | Search pharmacies by name  |
| /api/pharmacies/{id}  | GET | Get single pharmacy details  |
| /api/pharmacies/{id}/availability?medicine={medicineId}  | GET | Check medicine availability at a pharmacy  |
| /api/pharmacies/{id}/safety-score  | GET | Get/update safety score  |

**GOOD DOCTOR PAGE-Thomas Koori**

| Method  | Endpoint | Purpose |
| :---- | :---- | :---- |
| post | /chat  | get Dr. Ava reply |
| get | /sessionshistory | Load all conversation history |
| post | /session  | post all conversation history |
| get | /newsession  | Start a new session |
| delete | /deletesessions | Delete a session |
| post | /addreminders | Add a medicine reminder |
| get | /loadreminders | Get all reminders |
| delete | /deletereminders | Delete a reminder |
| get | /medicine/:name | Search medicine by name |

	
