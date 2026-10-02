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

// GET /api/inventory/:id - Retrieve single item by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // 1. Validate ID parameter format
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID parameter" });
  }

  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Map database properties to test output expectation
    res.status(200).json({
      id: data.id,
      name: data.item_name,
      stock: data.current_stock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inventory/:id - Update stock level
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  // 1. Check for missing required payload field
  if (stock === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 2. Validate ID parameter format
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID parameter" });
  }

  try {
    const { data, error } = await supabase
      .from("inventory")
      .update({ current_stock: Number(stock) })
      .eq("id", Number(id))
      .select();

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json({
      message: "Update Successful",
      product: {
        id: data[0].id,
        stock: data[0].current_stock,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
          reorder_point: Number(reorder_point, 10),
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
