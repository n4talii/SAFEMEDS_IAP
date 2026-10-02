const request = require("supertest");
const app = require("../server/index34");

// PATCH /products/:id Tests.

describe("PATCH /api/inventory/:id", () => {
  // 1. Happy path (200 Update Successful)
  it("should return 200 and success message when updating stock with valid payload", async () => {
    // Arrange
    const productId = 7;
    const updatePayLoad = { stock: 450 };

    // Act
    const res = await request(app)
      .patch(`/api/inventory/${productId}`)
      .send(updatePayLoad);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Update Successful");
    expect(res.body).toHaveProperty("product");
    expect(res.body.product).toHaveProperty("stock", 450);
  });

  // 2. Missing Required Fields (400)
  it("should return 400 when required update fields are missing", async () => {
    // Arrange
    const productId = 7;
    const emptyPayLoad = {}; // Empty body missing 'stock'

    // Act
    const res = await request(app)
      .patch(`/api/inventory/${productId}`)
      .send(emptyPayLoad);

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/missing required fields/i);
  });

  // 3. Not Found Case (404)
  it("should return 404 when attempting to update a non-existent item ID", async () => {
    // Arrange
    const nonExistentId = 88888;
    const updatePayLoad = { stock: 450 };

    // Act
    const res = await request(app)
      .patch(`/api/inventory/${nonExistentId}`)
      .send({ stock: 450 });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/item not found/i);
  });
});
