const path = require("path");
const express = require("express");
const cors = require("cors");
const reviewsRoutes = require("./routes/reviews");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const inventoryRoutes = require("./routes/inventory");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: "*", // Allows requests from both 127.0.0.1 and localhost
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware
app.use(cors());
app.use(express.json());

// Mount API routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/products", reviewsRoutes); // Serves /api/products/water-purification

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
