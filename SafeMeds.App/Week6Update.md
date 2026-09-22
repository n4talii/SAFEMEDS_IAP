# **Week 6 API Architecture and Needs update.**

## **Update date: 21st September 2026**

## **Context:**

\-            **During the Week 6 Lab. The activity required us to have at least one end point that Implemented a method other than a GET. We decided on a PATCH after a brief engagement with the Team leader of the Team Consumer.**

## **Updated API Needs Statement.**

**MajiApp requires the capability to partially update the available stock quantity of specific water-purification medications so that inventory levels remain accurate for prospective buyers in real time.**

## **Updated API End Points Table.**

| Method | Path | Purpose | Maps to Need |
| :---- | :---- | :---- | :---- |
| PATCH | /medications/{id}/stock | Enables MajiApp to modify the stock\_quantity field for a specific medication. | **MajiApp requires the capability to partially update the available stock quantity of specific water-purification medications so that inventory levels remain accurate for prospective buyers in real time.**   |

 

