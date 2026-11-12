const request = require("supertest");

jest.mock("../server/db", () => {
  const mockClient = { from: jest.fn() };
  return {
    dataSupabase: mockClient,
    authSupabase: mockClient,
    supabase: mockClient,
  };
});

const { dataSupabase: supabase } = require("../server/db");
const app = require("../server/index34");

describe("Product Endpoints (/api/inventory)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/inventory/:id", () => {
    it("should return 200 and product details for a valid numeric ID", async () => {
      const productId = 7;
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 7, item_name: "Amoxicillin 500mg", current_stock: 120 },
          error: null,
        }),
      });

      const res = await request(app).get(`/api/inventory/${productId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", productId);
      expect(res.body).toHaveProperty("name", "Amoxicillin 500mg");
      expect(typeof res.body.name).toBe("string");
      expect(res.body).toHaveProperty("stock", 120);
      expect(typeof res.body.stock).toBe("number");
    });

    it("should return 400 when a invalid non-numeric ID parameter is provided", async () => {
      const invalidId = "abc-invalid";

      const res = await request(app).get(`/api/inventory/${invalidId}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(typeof res.body.error).toBe("string");
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
