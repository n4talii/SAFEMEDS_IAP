# Deprecation notice: SafeMeds Water Purification Reviews API v1

To: MajiApp
From: SafeMeds
Date: 2026-11-12

## Summary

v1 of `GET /reviews` (and `GET /v1/reviews`) is deprecated. `v2` is live now at `GET /v2/reviews`. `v1` will stop working on 2026-11-13. Please move before then.

## What is changing

- The response list is wrapped in an object: `[...]` becomes `{ "data": [...], "count": N }`.
- Nothing else changes: `productId`, `productName`, `averageRating`, `reviewCount`, `topComment`, the top-3 highest-rated Water Purification filtering/ranking logic, and your `X-API-Key` remain the same.

## Why

Wrapping the list in a top-level object allows us to add pagination and category metadata later without introducing another breaking change.

## Before and after

v1 `GET /reviews` (and `GET /v1/reviews`)

```json
[
  {
    "productId": 22,
    "productName": "Lifestraw Drops",
    "averageRating": 5,
    "reviewCount": 1,
    "topComment": "Top quality stuff"
  },
  {
    "productId": 19,
    "productName": "Aquamira",
    "averageRating": 4.9,
    "reviewCount": 8,
    "topComment": "Cleans water instantly every time"
  },
  {
    "productId": 20,
    "productName": "Potable Aqua",
    "averageRating": 4.8,
    "reviewCount": 6,
    "topComment": "Best water treatment drops available"
  }
]
```

v2 `GET /v2/reviews`

```json
{
  "data": [
    {
      "productId": 22,
      "productName": "Lifestraw Drops",
      "averageRating": 5,
      "reviewCount": 1,
      "topComment": "Top quality stuff"
    },
    {
      "productId": 19,
      "productName": "Aquamira",
      "averageRating": 4.9,
      "reviewCount": 8,
      "topComment": "Cleans water instantly every time"
    },
    {
      "productId": 20,
      "productName": "Potable Aqua",
      "averageRating": 4.8,
      "reviewCount": 6,
      "topComment": "Best water treatment drops available"
    }
  ],
  "count": 3
}
```
