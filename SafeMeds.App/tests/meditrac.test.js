const express = require("express");
const request = require("supertest");
const meditracRoutes = require("../server/routes/meditrac");

const app = express();
app.use("/api/meditrac", meditracRoutes);

describe("GET /api/meditrac/medications/search", () => {
  const originalBaseUrl = process.env.MEDITRAC_BASE_URL;
  const originalApiKey = process.env.MEDITRAC_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.MEDITRAC_BASE_URL = "https://meditrac.example/";
    process.env.MEDITRAC_API_KEY = "test-only-key";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalBaseUrl === undefined) delete process.env.MEDITRAC_BASE_URL;
    else process.env.MEDITRAC_BASE_URL = originalBaseUrl;
    if (originalApiKey === undefined) delete process.env.MEDITRAC_API_KEY;
    else process.env.MEDITRAC_API_KEY = originalApiKey;
  });

  it("forwards supported query parameters and the API key only upstream", async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => '[{"name":"Example Medicine"}]',
    });

    const response = await request(app).get(
      "/api/meditrac/medications/search?name=Paracetamol&lat=-1.2&lng=36.8&in_stock=true&radius_km=2&limit=5&ignored=value",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ name: "Example Medicine" }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url.toString()).toBe(
      "https://meditrac.example/api/medications/search?name=Paracetamol&lat=-1.2&lng=36.8&in_stock=true&radius_km=2&limit=5",
    );
    expect(options.headers).toEqual({ "X-API-Key": "test-only-key" });
    expect(options.signal).toBeDefined();
    expect(response.text).not.toContain("test-only-key");
  });

  it("forwards upstream status and body", async () => {
    global.fetch.mockResolvedValue({
      status: 429,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => '{"error":"Rate limited"}',
    });

    const response = await request(app).get("/api/meditrac/medications/search");

    expect(response.status).toBe(429);
    expect(response.body).toEqual({ error: "Rate limited" });
  });

  it("rejects repeated query parameters", async () => {
    const response = await request(app).get(
      "/api/meditrac/medications/search?name=one&name=two",
    );

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns a configuration error without calling upstream when the key is missing", async () => {
    delete process.env.MEDITRAC_API_KEY;

    const response = await request(app).get("/api/meditrac/medications/search");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "MediTrac integration is not configured" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns a generic gateway error when the upstream request fails", async () => {
    global.fetch.mockRejectedValue(new Error("request failed"));

    const response = await request(app).get("/api/meditrac/medications/search");

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: "Unable to retrieve medications from MediTrac" });
  });
});
