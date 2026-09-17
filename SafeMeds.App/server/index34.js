const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");

const inventoryRoutes = require("./routes/inventory");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount API routes
app.use("/api/inventory", inventoryRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("SafeMeds API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
