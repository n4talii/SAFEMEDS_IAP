const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { id: 1, name: "Paracetamol", stock: 100 },
    { id: 2, name: "Amoxicillin", stock: 50 },
  ]);
});

module.exports = router;
