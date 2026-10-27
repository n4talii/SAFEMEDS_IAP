const express = require("express");
const router = express.Router();
const supabase = require("../db");

// 1. GET /api/reviews - Get all reviews with product details (For Dashboard Widget & MajiApp).
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select(
        `
                id,
                customer_name,
                rating,
                review_text,
                created_at,
                inventory (id, item_name, category)
            `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch reviews error:", err.message);
    res.status(500).json({ error: "Failed to retrieve reviews" });
  }
});

// 2. GET /api/products/water-purification - MajiApp specific endpoint for water purification product ratings.
router.get("/water-purification", async (req, res) => {
  const sort = req.query.sort || "rating";

  try {
    const { data: inventoryData, error: invError } = await supabase
      .from("inventory")
      .select("*")
      .ilike("category", "%water%");

    if (invError) throw invError;

    const { data: reviewsData, error: revError } = await supabase
      .from("product_reviews")
      .select("*");

    if (revError) throw revError;

    const results = inventoryData.map((prod) => {
      const prodReviews = reviewsData.filter((r) => r.product_id === prod.id);
      const totalScore = prodReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating =
        prodReviews.length > 0
          ? (totalScore / prodReviews.length).toFixed(1)
          : 0;

      return {
        productId: prod.id,
        productName: prod.item_name,
        averageRating: Number(avgRating),
        reviewCount: prodReviews.length,
      };
    });

    if (sort === "rating") {
      results.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sort === "name") {
      results.sort((a, b) => a.productName.localCompare(b.productName));
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/reviews - Submit a new review from the Landing Page modal.
router.post("/", async (req, res) => {
  const { product_id, customer_name, rating, review_text } = req.body;

  if (!product_id || !customer_name || !rating) {
    return res
      .status(400)
      .json({ error: "Product, Name, and Rating are required" });
  }

  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .insert([
        {
          product_id: Number(product_id),
          customer_name: customer_name,
          rating: Number(rating),
          review_text: review_text,
        },
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Insert review error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
