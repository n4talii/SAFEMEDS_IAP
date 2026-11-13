const express = require("express");
const router = express.Router();
const { dataSupabase: supabase } = require("../db");

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
        `
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

    const results = (inventoryData || []).map((prod) => {
      const prodReviews = (reviewsData || []).filter((r) => r.product_id === prod.id);
      const totalScore = prodReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
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
      results.sort((a, b) => a.productName.localeCompare(b.productName));
    }

    res.json(results);
  } catch (err) {
    console.error("Water purification ratings error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/reviews - Submit a new review (with 1-5 star rating and comment).
router.post("/", async (req, res) => {
  const { product_id, customer_name, rating, review_text } = req.body;

  if (!product_id || !customer_name || rating === undefined || rating === null) {
    return res
      .status(400)
      .json({ error: "Product, Name, and Rating are required." });
  }

  const parsedProductId = Number(product_id);
  const parsedRating = Number(rating);

  if (isNaN(parsedProductId) || parsedProductId <= 0) {
    return res.status(400).json({ error: "Invalid product selected." });
  }

  if (
    isNaN(parsedRating) ||
    !Number.isInteger(parsedRating) ||
    parsedRating < 1 ||
    parsedRating > 5
  ) {
    return res
      .status(400)
      .json({ error: "Rating must be a whole number between 1 and 5 stars." });
  }

  const cleanCustomerName = String(customer_name).trim();
  if (cleanCustomerName.length === 0 || cleanCustomerName.length > 100) {
    return res
      .status(400)
      .json({ error: "Customer name must be between 1 and 100 characters." });
  }

  const cleanReviewText = review_text ? String(review_text).trim().slice(0, 1000) : "";

  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .insert([
        {
          product_id: parsedProductId,
          customer_name: cleanCustomerName,
          rating: parsedRating,
          review_text: cleanReviewText,
        },
      ])
      .select(
        `
          id,
          customer_name,
          rating,
          review_text,
          created_at,
          inventory (id, item_name, category)
        `
      );

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Insert review error:", err.message);
    res.status(500).json({ error: "Failed to save review to the database." });
  }
});

module.exports = router;
