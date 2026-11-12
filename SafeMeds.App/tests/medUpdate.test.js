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

describe("PATCH /api/inventory/:id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 and success message when updating stock with valid payload", async () => {
    const productId = 7;
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: [{ id: 7, current_stock: 450 }],
        error: null,
      }),
    });

    const res = await request(app)
      .patch(`/api/inventory/${productId}`)
      .send({ stock: 450 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Update Successful");
    expect(res.body).toHaveProperty("product");
    expect(res.body.product).toHaveProperty("stock", 450);
  });

  it("should return 400 when required update fields are missing", async () => {
    const res = await request(app).patch("/api/inventory/7").send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/missing required fields/i);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("should return 404 when attempting to update a non-existent item ID", async () => {
    supabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    });

    const res = await request(app)
      .patch("/api/inventory/88888")
      .send({ stock: 450 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/item not found/i);
  });
});
