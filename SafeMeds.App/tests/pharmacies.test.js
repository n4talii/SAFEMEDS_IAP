const express = require("express");
const request = require("supertest");

jest.mock("../server/db", () => ({
  from: jest.fn(),
}));

const supabase = require("../server/db");
const pharmaciesRoute = require("../server/routes/pharmacies");

const app = express();
app.use("/api/pharmacies", pharmaciesRoute);

describe("GET /api/pharmacies", () => {
  let query;

  beforeEach(() => {
    query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn(),
    };
    supabase.from.mockReturnValue(query);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns verified pharmacies from the existing table, mapped and nearest first", async () => {
    query.range.mockResolvedValue({
      data: [
        {
          id: 1,
          pharmacy_id: "pharmacy-1",
          pharmacy_name: "Far Pharmacy",
          branch: "West",
          actual_address: "West address",
          latitude: 0,
          longitude: 0.08,
          safety_score: 7,
          in_stock: true,
          verified: true,
        },
        {
          id: 2,
          pharmacy_id: null,
          pharmacy_name: "Nearby Pharmacy",
          branch: "Central",
          actual_address: "Central address",
          latitude: 0,
          longitude: 0.02,
          safety_score: 9,
          in_stock: true,
          verified: true,
        },
        {
          id: 3,
          pharmacy_id: "pharmacy-3",
          pharmacy_name: "Outside Pharmacy",
          branch: "Far",
          actual_address: "Far address",
          latitude: 0,
          longitude: 0.2,
          safety_score: 8,
          in_stock: true,
          verified: true,
        },
      ],
      error: null,
    });

    const response = await request(app).get("/api/pharmacies?lat=0&lng=0&radius=10");

    expect(response.status).toBe(200);
    expect(response.body.map((pharmacy) => pharmacy.name)).toEqual([
      "Nearby Pharmacy",
      "Far Pharmacy",
    ]);
    expect(response.body[0].distance_km).toBeCloseTo(2.22, 1);
    expect(response.body[0]).toMatchObject({
      pharmacy_name: "Nearby Pharmacy",
      pharmacy_id: null,
      name: "Nearby Pharmacy",
      branch: "Central",
      actual_address: "Central address",
      address: "Central address",
      latitude: 0,
      longitude: 0.02,
      verified: true,
    });
    expect(supabase.from).toHaveBeenCalledWith("safe_meds_pharmacies");
    expect(query.select).toHaveBeenCalledWith(
      "id,pharmacy_id,pharmacy_name,branch,actual_address,latitude,longitude,safety_score,safety_score_updated_at,in_stock,verified",
    );
    expect(query.eq).toHaveBeenCalledWith("verified", true);
    expect(query.range).toHaveBeenCalledWith(0, 499);
  });

  it("filters pharmacies by name and uses the selected consumer location and radius", async () => {
    query.range.mockResolvedValue({
      data: [
        {
          id: 1,
          pharmacy_id: "family-id",
          pharmacy_name: "Family Pharmacy",
          branch: "Family branch",
          actual_address: "Family address",
          latitude: -1.28,
          longitude: 36.82,
          safety_score: 7,
          in_stock: true,
          verified: true,
        },
        {
          id: 2,
          pharmacy_id: null,
          pharmacy_name: "Central Pharmacy",
          branch: "Central branch",
          actual_address: "Central address",
          latitude: -1.28,
          longitude: 36.82,
          safety_score: 7,
          in_stock: true,
          verified: true,
        },
      ],
      error: null,
    });

    const response = await request(app).get(
      "/api/pharmacies?lat=-1.28&lng=36.82&radius=5&search=family",
    );

    expect(response.status).toBe(200);
    expect(response.body.map((pharmacy) => pharmacy.name)).toEqual(["Family Pharmacy"]);
    expect(response.body[0].branch).toBe("Family branch");
    expect(response.body[0].pharmacy_id).toBe("family-id");
    expect(response.body[0].address).toBe("Family address");
    expect(response.body[0].verified).toBe(true);
    expect(query.gte).toHaveBeenCalledWith("latitude", expect.any(Number));
    expect(query.lte).toHaveBeenCalledWith("latitude", expect.any(Number));
  });

  it("rejects requests without valid coordinates and radius", async () => {
    const response = await request(app).get("/api/pharmacies?lat=invalid&lng=0&radius=10");

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/lat, lng, and radius/i);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
