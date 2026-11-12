const { fetchPartnerAvailability, getMedicationsPath } = require("./partner");

const SAMPLE_ITEMS = [
  {
    id: "33150a73-d929-4cc8-b911-333820e4d6bb",
    name: "Amlodipine 5mg",
    quantity: 60,
    branch: "CBD Branch",
    pharmacy: "Wellness Pharmacy",
  },
  {
    id: "b9cd042a-f99f-44b2-8446-db25553ee4e7",
    name: "Amoxicillin",
    quantity: 0,
    branch: "Kasarani Branch",
    pharmacy: "Mavos pharmaceuticals",
  },
];

function mockFetchWith(body) {
  return async (url) => ({
    ok: true,
    status: 200,
    url,
    json: async () => body,
  });
}

describe("MediTrac partner adapter (v1 and v2)", () => {
  test("selects /api/medications for v1 and /api/v2/medications for v2", () => {
    expect(getMedicationsPath("v1")).toBe("/api/medications");
    expect(getMedicationsPath("v2")).toBe("/api/v2/medications");
  });

  test("parses v1 bare array response into normalized pharmacy availability", async () => {
    let calledUrl = "";
    const result = await fetchPartnerAvailability({
      baseUrl: "https://meditrac-api.onrender.com",
      apiKey: "test-key",
      version: "v1",
      fetchImpl: async (url) => {
        calledUrl = url;
        return mockFetchWith(SAMPLE_ITEMS)(url);
      },
    });

    expect(calledUrl).toBe("https://meditrac-api.onrender.com/api/medications");
    expect(result.pharmacies).toHaveLength(2);
    expect(result.pharmacies[0]).toMatchObject({
      pharmacy: "Wellness Pharmacy",
      branch: "CBD Branch",
      available_medicines: 1,
      status: "in_stock",
    });
  });

  test("parses v2 response (both bare array and wrapped { data } object) into identical shape", async () => {
    let calledUrl = "";
    const resultWrapped = await fetchPartnerAvailability({
      baseUrl: "https://meditrac-api.onrender.com",
      apiKey: "test-key",
      version: "v2",
      fetchImpl: async (url) => {
        calledUrl = url;
        return mockFetchWith({ data: SAMPLE_ITEMS, count: 2 })(url);
      },
    });

    expect(calledUrl).toBe(
      "https://meditrac-api.onrender.com/api/v2/medications",
    );
    expect(resultWrapped.pharmacies).toHaveLength(2);
    expect(resultWrapped.pharmacies[1]).toMatchObject({
      pharmacy: "Mavos pharmaceuticals",
      branch: "Kasarani Branch",
      available_medicines: 0,
      status: "out_of_stock",
    });
  });
});
