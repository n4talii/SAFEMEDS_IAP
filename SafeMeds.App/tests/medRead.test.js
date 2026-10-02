const request = require("supertest");
const app = require("../server/index34");

describe("Product Endpoints (/api/inventory)", () => {
  // GET the product by the ID.

  describe("GET /api/inventory/:id", () => {
    //  1. The Happy path (200 Okay)
    it("should return 200 and product details for a valid numeric ID", async () => {
      // Arrange
      const productId = 7;

      //Act
      const res = await request(app).get(`/api/inventory/${productId}`);

      //Assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", productId);
      expect(res.body).toHaveProperty("name");
      expect(typeof res.body.name).toBe("string");
      expect(res.body).toHaveProperty("stock");
      expect(typeof res.body.stock).toBe("number");
    });

    // 2. Validation Rejection / Bad Request (400)
    it("should return 400 when a invalid non-numeric ID parameter is provided", async () => {
      //Arrange
      const invalidId = "abc-invalid";

      //Act
      const res = await request(app).get(`/api/inventory/${invalidId}`);

      //Assert
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(typeof res.body.error).toBe("string");
    });
  });
});
