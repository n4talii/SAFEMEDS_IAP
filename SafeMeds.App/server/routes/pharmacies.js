const express = require("express");
const supabase = require("../db");

const router = express.Router();
const PAGE_SIZE = 500;
const EARTH_RADIUS_KM = 6371.0088;

function parseCoordinate(value, min, max) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function distanceInKm(lat1, lng1, lat2, lng2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lng2 - lng1);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

router.get("/directory", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("safe_meds_pharmacies")
      .select("pharmacy_name,branch,actual_address")
      .order("pharmacy_name", { ascending: true })
      .range(0, 999);
    if (error) throw error;
    const pharmacies = (data || [])
      .map((row) => ({
        pharmacy_name: String(row.pharmacy_name || "").trim(),
        branch: String(row.branch || "").trim(),
        actual_address: String(row.actual_address || "").trim(),
      }))
      .filter((row) => row.pharmacy_name)
      .sort((a, b) => a.pharmacy_name.localeCompare(b.pharmacy_name) || a.branch.localeCompare(b.branch));
    res.set("Cache-Control", "public, max-age=300");
    return res.json({ pharmacies });
  } catch (error) {
    console.error("Supabase pharmacy directory error:", error.message);
    return res.status(500).json({ error: "Failed to retrieve the pharmacy directory" });
  }
});

router.get("/", async (req, res) => {
  const latitude = parseCoordinate(req.query.lat, -90, 90);
  const longitude = parseCoordinate(req.query.lng, -180, 180);
  const radius = parseCoordinate(req.query.radius, 0.1, 100);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  if (latitude === null || longitude === null || radius === null) {
    return res.status(400).json({
      error: "Valid lat, lng, and radius (0.1–100 km) query parameters are required",
    });
  }
  if (Array.isArray(req.query.search) || search.length > 100) {
    return res.status(400).json({ error: "Search must be a single string of at most 100 characters" });
  }

  const latitudeDelta = radius / 110.5;
  const minLatitude = Math.max(-90, latitude - latitudeDelta);
  const maxLatitude = Math.min(90, latitude + latitudeDelta);
  const crossesEquator = minLatitude <= 0 && maxLatitude >= 0;
  const maxCosine =
    crossesEquator
      ? 1
      : Math.min(
          Math.cos((minLatitude * Math.PI) / 180),
          Math.cos((maxLatitude * Math.PI) / 180),
        );
  const longitudeDelta = radius / (110.5 * maxCosine);
  const canFilterLongitude =
    longitudeDelta < 180 &&
    longitude - longitudeDelta >= -180 &&
    longitude + longitudeDelta <= 180;

  try {
    const pharmacies = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      let query = supabase
        .from("safe_meds_pharmacies")
        .select("id,pharmacy_id,pharmacy_name,branch,actual_address,latitude,longitude,safety_score,safety_score_updated_at,in_stock,verified")
        .eq("verified", true)
        .gte("latitude", minLatitude)
        .lte("latitude", maxLatitude)
        .order("id", { ascending: true });

      if (canFilterLongitude) {
        query = query
          .gte("longitude", longitude - longitudeDelta)
          .lte("longitude", longitude + longitudeDelta);
      }

      const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      pharmacies.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
    }

    const matchingPharmacies = pharmacies
      .map((pharmacy) => ({
        ...pharmacy,
        pharmacy_id: pharmacy.pharmacy_id ?? null,
        name: pharmacy.pharmacy_name,
        address: pharmacy.actual_address,
        type: "Pharmacy",
        distance_km: distanceInKm(
          latitude,
          longitude,
          Number(pharmacy.latitude),
          Number(pharmacy.longitude),
        ),
      }))
      .filter((pharmacy) =>
        !search ||
        `${pharmacy.name || ""} ${pharmacy.branch || ""}`.toLowerCase().includes(search.toLowerCase()),
      )
      .filter((pharmacy) => pharmacy.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);

    return res.json(matchingPharmacies);
  } catch (error) {
    console.error("Supabase pharmacy fetch error:", error.message);
    return res.status(500).json({ error: "Failed to retrieve nearby pharmacies" });
  }
});

module.exports = router;
