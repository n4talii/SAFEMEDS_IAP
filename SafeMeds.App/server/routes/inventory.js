const express = require("express");
const router = express.Router();
const supabase = require("../db");
const { ascending } = require("firebase/firestore/pipelines");

//GET /api/inventory - Retrieve all items from Superbase
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Supabase fetch error:", err.message);
    res.status(500).json({ error: "Failed to retrieve inventory data" });
  }
});

// POST /api/inventory - Insert new medicine into Supabase
router.post("/", async (req, res) => {
  try {
    const {
      item_name,
      sku,
      category,
      current_stock,
      reorder_point,
      last_restocked,
      safety_rating,
    } = req.body;

    const { data, error } = await supabase
      .from("inventory")
      .insert([
        {
          item_name,
          sku: Number(sku, 10),
          category,
          current_stock: Number(current_stock, 10),
          reorder_point: Number(current_stock, 10),
          last_restocked,
          safety_rating,
        },
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Supabase insert error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
