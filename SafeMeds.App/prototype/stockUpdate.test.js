const request = require("supertest");
const app = require("../server/index34"); // Path to your Express app instance
// ==========================================
// PATCH /products/:id Tests
// ==========================================
describe("PATCH /api/inventory/:id", () => {
  // 1. Happy Path (200 Update Successful)
  it("should return 200 and success message when updating stock with valid payload", async () => {
    // Arrange
    const productId = 8;
    const updatePayload = { stock: 400 };

    // Act
    const res = await request(app)
      .patch(`/api/inventory/${productId}`)
      .send(updatePayload);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Update Successful");
    expect(res.body).toHaveProperty("product");
    expect(res.body.product).toHaveProperty("stock", 400);
  });

  // 2. Missing Required Fields (400)
  it("should return 400 when required update fields are missing", async () => {
    // Arrange
    const productId = 8;
    const emptyPayload = {}; // Empty body missing 'stock'

    // Act
    const res = await request(app)
      .patch(`/api/inventory/${productId}`)
      .send(emptyPayload);

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/missing required fields/i);
  });

  // 3. Not Found Case (404)
  it("should return 404 when attempting to update a non-existent item ID", async () => {
    // Arrange
    const nonExistentId = 99999;
    const updatePayload = { stock: 10 };

    // Act
    const res = await request(app)
      .patch(`/api/inventory/${nonExistentId}`)
      .send({ stock: 10 });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/item not found/i);
  });
});
