const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());
app.use("/docs", express.static(path.join(__dirname, "../docs")));
app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "../openapi.yaml"));
});

// Local demonstration records let a clean clone exercise the Week 8 contract
// without requiring a database or credentials. They are not production data.
const inventory = [
  {
    productId: 100102,
    productName: "Chlorine Tablets 100mg",
    productCategory: "water-purification",
    availableQuantity: 450,
    isAvailable: true,
  },
];

const ratedProducts = [
  {
    productId: 100102,
    productName: "AquaClean Purification Drops",
    averageRating: 4.8,
    reviewCount: 124,
  },
];

const areaAlerts = [
  {
    alertId: "alt-8812",
    region: "eastern-district",
    illnessType: "Cholera",
    severity: "high",
    detectedAt: "2026-08-13T10:00:00Z",
  },
];

const providers = [
  {
    providerId: "vnd-109",
    name: "SafeCare Pharmacy",
    type: "pharmacy",
    status: "verified",
    address: "123 Commercial St, Nairobi",
    lat: -1.286389,
    lng: 36.817223,
  },
  {
    providerId: "exp-302",
    name: "Dr. Jane Wanjiku",
    type: "health_expert",
    status: "verified",
    specialty: "Water Sanitation Specialist",
    phone: "+254712345678",
    lat: -1.29,
    lng: 36.82,
  },
];

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function invalid(message) {
  return { message };
}

app.get("/", (req, res) => {
  res.type("text/plain").send("SafeMeds API is running");
});

app.get("/api", (req, res) => {
  res.json({ status: "ok", name: "SafeMeds API" });
});

app.get("/api/inventory", (req, res) => {
  const { product, available } = req.query;
  if (available !== undefined && !["true", "false"].includes(available)) {
    return res.status(400).json(invalid("available must be true or false."));
  }

  let results = inventory;
  if (product) {
    const normalizedProduct = product.toLowerCase().replace(/[_\s]/g, "-");
    results = results.filter((item) =>
      item.productName.toLowerCase().replace(/[_\s]/g, "-").includes(normalizedProduct),
    );
  }
  if (available !== undefined) {
    results = results.filter((item) => item.isAvailable === (available === "true"));
  }

  res.json(results.map(({ productId, productName, availableQuantity, isAvailable }) => ({
    productId,
    productName,
    availableQuantity,
    isAvailable,
  })));
});

app.get("/api/products/water-purification", (req, res) => {
  const sort = req.query.sort || "rating";
  if (!["rating", "name"].includes(sort)) {
    return res.status(400).json(invalid("sort must be rating or name."));
  }

  const results = [...ratedProducts].sort((a, b) =>
    sort === "rating"
      ? b.averageRating - a.averageRating
      : a.productName.localeCompare(b.productName),
  );
  res.json(results);
});

app.get("/api/health-signals/area-alerts", (req, res) => {
  const { region, since } = req.query;
  if (!region || !since || !isDate(since)) {
    return res.status(400).json(invalid("region and a valid since date (YYYY-MM-DD) are required."));
  }

  const results = areaAlerts.filter(
    (alert) => alert.region === region && alert.detectedAt.slice(0, 10) >= since,
  );
  res.json(results);
});

app.get("/api/providers", (req, res) => {
  const { type, status, lat, lng, radius } = req.query;
  const latitude = Number(lat);
  const longitude = Number(lng);
  const radiusKm = Number(radius);

  if (
    !["pharmacy", "health_expert"].includes(type) ||
    status !== "verified" ||
    lat === undefined ||
    lng === undefined ||
    radius === undefined ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(radiusKm) ||
    radiusKm <= 0
  ) {
    return res.status(400).json(invalid("type, status, valid lat/lng coordinates, and a positive radius are required."));
  }

  const results = providers
    .filter((provider) => provider.type === type && provider.status === status)
    .filter((provider) => distanceKm(latitude, longitude, provider.lat, provider.lng) <= radiusKm)
    .map(({ lat: providerLat, lng: providerLng, ...provider }) => provider);
  res.json(results);
});

app.patch("/api/medications/:id/stock", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json(invalid("id must be a positive integer."));
  }

  const { stockQuantity } = req.body || {};
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json(invalid("stockQuantity must be an integer greater than or equal to 0."));
  }

  const item = inventory.find((candidate) => candidate.productId === id);
  if (!item) {
    return res.status(404).json(invalid(`Medication with ID ${id} not found.`));
  }

  item.availableQuantity = stockQuantity;
  item.isAvailable = stockQuantity > 0;
  res.json({
    productId: item.productId,
    productName: item.productName,
    stockQuantity: item.availableQuantity,
    productCategory: item.productCategory,
  });
});

app.use((req, res) => {
  res.status(404).json(invalid("Route not found."));
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json(invalid("Request body must contain valid JSON."));
  }
  console.error(err);
  res.status(500).json(invalid("Internal server error."));
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`SafeMeds API listening at http://localhost:${PORT}`);
  });
}

module.exports = app;
