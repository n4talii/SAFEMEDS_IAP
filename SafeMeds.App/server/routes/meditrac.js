const express = require("express");

const router = express.Router();
const QUERY_PARAMETERS = ["name", "lat", "lng", "in_stock", "radius_km", "limit"];
const AVAILABILITY_CACHE_MS = 60_000;
const AVAILABILITY_TIMEOUT_MS = 75_000;

let availabilityCache = null;
let availabilityRequest = null;

function normalizeLabel(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function medicationRecords(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || payload?.data || payload?.medications || payload?.items || null;
}

function summarizeAvailability(records) {
  const groups = new Map();

  for (const item of records) {
    const pharmacy = typeof item?.pharmacy === "string"
      ? item.pharmacy
      : item?.pharmacy?.name || item?.pharmacy_name || "";
    const branch = String(item?.branch ?? "").trim();
    const pharmacyKey = normalizeLabel(pharmacy);
    const branchKey = normalizeLabel(branch);
    if (!pharmacyKey) continue;

    const key = `${pharmacyKey}|${branchKey}`;
    const group = groups.get(key) || {
      pharmacy: String(pharmacy).trim(),
      branch,
      pharmacy_key: pharmacyKey,
      branch_key: branchKey,
      listed_medicines: 0,
      checked_medicines: 0,
      available_medicines: 0,
    };
    group.listed_medicines += 1;

    const quantity = item?.quantity === null || item?.quantity === undefined || item?.quantity === ""
      ? null
      : Number(item.quantity);
    const hasQuantity = Number.isFinite(quantity);
    const hasStockFlag = typeof item?.in_stock === "boolean";
    if (hasQuantity || hasStockFlag) {
      group.checked_medicines += 1;
      if (hasStockFlag ? item.in_stock : quantity > 0) group.available_medicines += 1;
    }
    groups.set(key, group);
  }

  const pharmacies = [...groups.values()].map((group) => ({
    ...group,
    status: group.available_medicines > 0
      ? "in_stock"
      : group.checked_medicines > 0
        ? "out_of_stock"
        : "unknown",
  }));

  return { fetched_at: new Date().toISOString(), pharmacies };
}

async function fetchAvailability(baseUrl, apiKey) {
  const upstreamUrl = new URL("/api/medications", `${baseUrl.replace(/\/+$/, "")}/`);
  const upstreamResponse = await fetch(upstreamUrl, {
    headers: { "X-API-Key": apiKey },
    signal: AbortSignal.timeout(AVAILABILITY_TIMEOUT_MS),
  });
  if (!upstreamResponse.ok) throw new Error(`MediTrac returned ${upstreamResponse.status}`);

  const payload = await upstreamResponse.json();
  const records = medicationRecords(payload);
  if (!Array.isArray(records)) throw new Error("MediTrac returned an unsupported medication list");
  return summarizeAvailability(records);
}

router.get("/medications/availability", async (req, res) => {
  const baseUrl = process.env.MEDITRAC_BASE_URL;
  const apiKey = process.env.MEDITRAC_API_KEY;
  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: "MediTrac integration is not configured" });
  }

  const now = Date.now();
  if (availabilityCache && now - availabilityCache.cachedAt < AVAILABILITY_CACHE_MS) {
    return res.json({ ...availabilityCache.data, stale: false });
  }

  if (!availabilityRequest) availabilityRequest = fetchAvailability(baseUrl, apiKey);
  try {
    const data = await availabilityRequest;
    availabilityCache = { data, cachedAt: Date.now() };
    return res.json({ ...data, stale: false });
  } catch {
    console.error("MediTrac pharmacy availability request failed");
    if (availabilityCache) return res.json({ ...availabilityCache.data, stale: true });
    return res.status(502).json({ error: "Unable to retrieve pharmacy availability from MediTrac" });
  } finally {
    availabilityRequest = null;
  }
});

router.get("/medications/search", async (req, res) => {
  const baseUrl = process.env.MEDITRAC_BASE_URL;
  const apiKey = process.env.MEDITRAC_API_KEY;

  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: "MediTrac integration is not configured" });
  }

  const searchParams = new URLSearchParams();
  for (const name of QUERY_PARAMETERS) {
    const value = req.query[name];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      return res.status(400).json({ error: `Query parameter '${name}' must be a single value` });
    }
    searchParams.set(name, value);
  }

  try {
    const upstreamUrl = new URL(
      `/api/medications/search?${searchParams.toString()}`,
      `${baseUrl.replace(/\/+$/, "")}/`,
    );
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(10000),
    });
    const body = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type");

    if (contentType) res.set("Content-Type", contentType);
    return res.status(upstreamResponse.status).send(body);
  } catch {
    console.error("MediTrac medication search request failed");
    return res.status(502).json({ error: "Unable to retrieve medications from MediTrac" });
  }
});

module.exports = router;