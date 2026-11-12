const AVAILABILITY_TIMEOUT_MS = 75_000;

function normalizeLabel(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Handles both bare arrays (v1) and wrapped objects (v2) from MediTrac
function extractMedicationRecords(payload) {
  if (Array.isArray(payload)) return payload;
  return (
    payload?.data ||
    payload?.results ||
    payload?.medications ||
    payload?.items ||
    null
  );
}

function summarizeAvailability(records) {
  const groups = new Map();

  for (const item of records) {
    const pharmacy =
      typeof item?.pharmacy === "string"
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

    const quantity =
      item?.quantity === null ||
      item?.quantity === undefined ||
      item?.quantity === ""
        ? null
        : Number(item.quantity);
    const hasQuantity = Number.isFinite(quantity);
    const hasStockFlag = typeof item?.in_stock === "boolean";
    if (hasQuantity || hasStockFlag) {
      group.checked_medicines += 1;
      if (hasStockFlag ? item.in_stock : quantity > 0)
        group.available_medicines += 1;
    }
    groups.set(key, group);
  }

  const pharmacies = [...groups.values()].map((group) => ({
    ...group,
    status:
      group.available_medicines > 0
        ? "in_stock"
        : group.checked_medicines > 0
          ? "out_of_stock"
          : "unknown",
  }));

  return { fetched_at: new Date().toISOString(), pharmacies };
}

function getMedicationsPath(version = process.env.PARTNER_VERSION || "v2") {
  const cleanVersion = String(version).trim().toLowerCase();
  return cleanVersion === "v1"
    ? "/api/medications"
    : `/api/${cleanVersion}/medications`;
}

async function fetchPartnerAvailability({
  baseUrl = process.env.MEDITRAC_BASE_URL,
  apiKey = process.env.MEDITRAC_API_KEY,
  version = process.env.PARTNER_VERSION || "v2",
  fetchImpl = fetch,
} = {}) {
  const path = getMedicationsPath(version);
  const upstreamUrl = new URL(path, `${baseUrl.replace(/\/+$/, "")}/`);

  const upstreamResponse = await fetchImpl(upstreamUrl.toString(), {
    headers: { "X-API-Key": apiKey },
    signal: AbortSignal.timeout(AVAILABILITY_TIMEOUT_MS),
  });

  if (!upstreamResponse.ok) {
    throw new Error(`MediTrac returned ${upstreamResponse.status}`);
  }

  const payload = await upstreamResponse.json();
  const records = extractMedicationRecords(payload);
  if (!Array.isArray(records)) {
    throw new Error("MediTrac returned an unsupported medication list");
  }

  return summarizeAvailability(records);
}

module.exports = {
  getMedicationsPath,
  extractMedicationRecords,
  summarizeAvailability,
  fetchPartnerAvailability,
};
