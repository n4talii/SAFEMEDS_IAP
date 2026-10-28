const path = require("path");
const express = require("express");
const cors = require("cors");
const reviewsRoutes = require("./routes/reviews");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const inventoryRoutes = require("./routes/inventory");
const pharmaciesRoutes = require("./routes/pharmacies");
const meditracRoutes = require("./routes/meditrac");
const profileRoutes = require("./routes/profiles");
const goodDoctorRoutes = require("./routes/gooddoctor");

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
app.use("/api/pharmacies", pharmaciesRoutes);
app.use("/api/meditrac", meditracRoutes);
app.use("/api/gooddoctor", goodDoctorRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/products", reviewsRoutes); // Serves /api/products/water-purification

if (require.main === module) {
  globalThis.safeMedsServerKeepAlive = setInterval(() => {}, 60000);
  globalThis.safeMedsHttpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
