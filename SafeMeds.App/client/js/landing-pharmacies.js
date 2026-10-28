const PHARMACIES_API_URL = "http://localhost:8080/api/pharmacies";
const GEOCODING_API_URL = "https://nominatim.openstreetmap.org/search";
const MAX_SEARCH_RADIUS_KM = 20;

// Distance rings (km), same colors as the legend
const ZONES = [
  { fraction: 0.4, cls: "green", color: "#22c55e", label: "✅ Safe Zone", dash: null },
  { fraction: 0.7, cls: "yellow", color: "#eab308", label: "⚠️ Medium Zone", dash: "6 6" },
  { fraction: 1, cls: "red", color: "#ef4444", label: "🔴 Caution Zone", dash: "6 6" },
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);

const zoneFor = (km) =>
  ZONES.find((z) => km <= radiusKm * z.fraction) || ZONES[ZONES.length - 1];
// Score badge color: higher score = safer
const scoreClass = (s) => (s >= 7 ? "green-score" : s >= 5 ? "yellow-score" : "red-score");

let map;
let userMarker;
let rings = [];
let pharmacyLayer;
let center = null;
let radiusKm = 3;
let locationLabel = "";
let searchTerm = "";
let requestId = 0;
let geocodeRequestId = 0;
let medicineSearchName = "";
let medicineSearchStatus = "idle";
let medicineStockByPharmacyId = new Map();
let currentPharmacies = [];

const scoreUpdatedLabel = (value) => {
  if (!value) return "Manual score · date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Manual score · date not recorded";
  return `Updated ${date.toLocaleString()}`;
};

function renderAvailability(pharmacy) {
  const pharmacyId = pharmacy.pharmacy_id;
  if (pharmacyId === null || pharmacyId === undefined || String(pharmacyId).trim() === "") {
    return '<span class="card-availability is-unknown">Live stock not available for this branch</span>';
  }
  if (medicineSearchStatus === "loading") {
    return `<span class="card-availability is-pending">Checking ${esc(medicineSearchName)} stock…</span>`;
  }
  if (medicineSearchStatus === "idle") {
    return '<span class="card-availability is-unknown">Search for a medicine to check live stock</span>';
  }
  const stock = medicineStockByPharmacyId.get(String(pharmacyId));
  if (!stock) {
    return '<span class="card-availability is-unknown">Live stock not available for this branch</span>';
  }
  if (stock.stock_quantity !== undefined && stock.stock_unit && Number(stock.stock_quantity) > 0) {
    return `<span class="card-availability">${esc(stock.stock_quantity)} ${esc(stock.stock_unit)} available for ${esc(medicineSearchName)}</span>`;
  }
  if (stock.in_stock === true) {
    return `<span class="card-availability">${esc(medicineSearchName)} in stock</span>`;
  }
  if (stock.in_stock === false || (stock.stock_quantity !== undefined && Number(stock.stock_quantity) <= 0)) {
    return `<span class="card-availability is-out">${esc(medicineSearchName)} out of stock</span>`;
  }
  return `<span class="card-availability is-unknown">${esc(stock.stock_label)} · ${esc(medicineSearchName)}</span>`;
}

function initMap() {
  const el = document.getElementById("map");
  if (!el || typeof L === "undefined") return false;

  map = L.map(el, {
    zoomControl: false,
    scrollWheelZoom: false, // don't hijack page scrolling
    dragging: !L.Browser.mobile, // one-finger drag should scroll the page on phones
  }).setView([20, 0], 2);

  L.control.zoom({ position: "topleft" }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  pharmacyLayer = L.layerGroup().addTo(map);
  return true;
}

function setCenter(lat, lng, label) {
  center = { lat, lng };
  locationLabel = label;
  window.dispatchEvent(new CustomEvent("safemeds:locationchange", {
    detail: { lat, lng },
  }));
  if (map) {
    if (!userMarker) {
      userMarker = L.marker([lat, lng], {
        zIndexOffset: 1000,
        keyboard: false,
        icon: L.divIcon({
          className: "user-div-icon",
          iconSize: [36, 42],
          iconAnchor: [18, 42],
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 24 24" fill="#0b5394" stroke="#ffffff" stroke-width="1"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>`,
        }),
      }).addTo(map);
    } else {
      userMarker.setLatLng([lat, lng]);
    }
    userMarker.unbindTooltip().bindTooltip(`Search location: ${esc(locationLabel)}`, {
      direction: "top",
      offset: [0, -40],
    });
    updateRings();
    map.fitBounds(rings[0].getBounds(), { padding: [10, 10] });
  }
  setStatus(`Showing pharmacies within ${radiusKm} km of ${locationLabel}`);
  loadPharmacies();
}

function updateRings() {
  if (!center || !map) return;
  rings.forEach((ring) => ring.remove());
  rings = [...ZONES].reverse().map((zone) =>
    L.circle([center.lat, center.lng], {
      radius: radiusKm * zone.fraction * 1000,
      color: zone.color,
      weight: 2,
      dashArray: zone.dash,
      fillColor: zone.color,
      fillOpacity: zone.fraction === 0.4 ? 0.12 : 0.06,
      interactive: false,
    }).addTo(map),
  );
}

function setStatus(text) {
  const el = document.getElementById("location-status");
  if (el) el.textContent = text;
}

function locate() {
  if (!navigator.geolocation) {
    setStatus("Device location isn't supported. Enter a city or address instead.");
    return;
  }
  const button = document.getElementById("locate-btn");
  if (!button || button.disabled) return;

  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.textContent = "Locating…";
  setStatus("Requesting your location from your device…");

  const finish = () => {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.textContent = "📍 Use my location";
  };

  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        finish();
        setCenter(pos.coords.latitude, pos.coords.longitude, "your current location");
      },
      (error) => {
        finish();
        if (error.code === 1) {
          setStatus("Location permission was denied. Allow location access in your browser settings, or enter a city or address.");
        } else if (error.code === 3) {
          setStatus("Location lookup timed out. Check your connection or GPS and try again, or enter a city or address.");
        } else {
          setStatus("Your device couldn't determine your location. Check your location settings, or enter a city or address.");
        }
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false },
    );
  } catch {
    finish();
    setStatus("Device location is unavailable. Check your browser settings, or enter a city or address.");
  }
}

async function searchLocation(query) {
  const mine = ++geocodeRequestId;
  const submitButton = document.querySelector("#location-search-form button[type='submit']");
  const originalText = submitButton?.textContent;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Searching…";
    submitButton.setAttribute("aria-busy", "true");
  }
  setStatus("Finding that location…");
  try {
    const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1" });
    const res = await fetch(`${GEOCODING_API_URL}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const matches = await res.json();
    if (mine !== geocodeRequestId) return;
    if (!Array.isArray(matches) || !matches.length) {
      setStatus("Location not found. Try a nearby town or a more specific address.");
      return;
    }
    const result = matches[0];
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("Geocoder returned invalid coordinates");
    }
    setCenter(lat, lng, result.name || query);
  } catch (err) {
    console.error("Location search failed:", err);
    if (mine === geocodeRequestId) setStatus("Location search is unavailable. Try using your device location.");
  } finally {
    if (mine === geocodeRequestId && submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      submitButton.removeAttribute("aria-busy");
    }
  }
}

function renderMarkers(list) {
  pharmacyLayer.clearLayers();
  list
    .filter((p) => Number(p.distance_km) <= radiusKm)
    .forEach((p) => {
      const z = zoneFor(p.distance_km);
      L.marker([p.latitude, p.longitude], {
        title: p.name,
        icon: L.divIcon({
          className: "pharmacy-div-icon",
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          html: `<span class="pin-marker ${z.cls}"></span>`,
        }),
      })
        .bindTooltip(
        `<h4>${esc(p.name)}${p.branch ? ` · ${esc(p.branch)}` : ""}</h4><p>${p.verified ? "Verified" : "Unverified demo listing"} · ${z.label} · ${p.distance_km.toFixed(1)}km away</p>`,
          { direction: "top", offset: [0, -10], className: "pharmacy-tooltip" },
        )
        .addTo(pharmacyLayer);
    });
}

function renderCards(list) {
  const cardsEl = document.getElementById("pharmacy-cards");
  if (!cardsEl) return;
  if (!list.length) {
    const canExpandSearch = radiusKm < MAX_SEARCH_RADIUS_KM;
    const expandButton = canExpandSearch
      ? `<button type="button" class="expand-search-btn" id="expand-search-btn">Expand search to ${MAX_SEARCH_RADIUS_KM} km</button>`
      : '<p class="cards-note">Try a nearby location or check back later.</p>';
    const message = `No pharmacies found within ${radiusKm} km of ${esc(locationLabel)}.`;
    cardsEl.innerHTML = `<p class="cards-note">${message}</p>${expandButton}`;
    setStatus(message);
    return;
  }
  cardsEl.innerHTML = list
      .slice(0, 3)
      .map(
        (p) => `
      <div class="pharmacy-card">
        <div class="card-header">
          <h3 class="card-name">${esc(p.name)}</h3>
          <span class="card-distance">📍 ${p.distance_km.toFixed(1)}km</span>
        </div>
        <p class="card-type">${esc(p.branch || p.type || "Pharmacy")}</p>
        ${p.address ? `<p class="card-address">${esc(p.address)}</p>` : ""}
        <span class="card-verification ${p.verified ? "is-verified" : "is-unverified"}">${p.verified ? "Verified" : "Unverified · demo listing"}</span>
        <div class="card-footer">
          <div class="card-score-wrapper">
            <span class="card-score-label">Safety Score</span>
            <div class="card-score ${p.safety_score == null ? "score-unrated" : scoreClass(Number(p.safety_score))}">${p.safety_score == null ? "—" : esc(p.safety_score)}</div>
            <span class="score-updated">${esc(scoreUpdatedLabel(p.safety_score_updated_at))}</span>
          </div>
          ${renderAvailability(p)}
        </div>
      </div>`,
      )
      .join("");
}

async function fetchPharmacies() {
  const params = new URLSearchParams({
    lat: center.lat,
    lng: center.lng,
    radius: radiusKm,
  });
  if (searchTerm) params.set("search", searchTerm);
  const res = await fetch(`${PHARMACIES_API_URL}?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadPharmacies() {
  if (!center) {
    const cardsEl = document.getElementById("pharmacy-cards");
    if (cardsEl) cardsEl.innerHTML = '<p class="cards-note">Choose your location to see nearby pharmacies.</p>';
    return;
  }
  const mine = ++requestId; // ignore out-of-order responses
  try {
    const list = await fetchPharmacies();
    if (mine !== requestId) return;
    currentPharmacies = list;
    if (pharmacyLayer) renderMarkers(list);
    renderCards(list);
  } catch (err) {
    console.error("Failed to load pharmacies:", err);
    setStatus("Pharmacy data is unavailable. Check the database connection and try again.");
    const cardsEl = document.getElementById("pharmacy-cards");
    if (cardsEl) cardsEl.innerHTML = '<p class="cards-note">Pharmacy data couldn’t be loaded. Please try again later.</p>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const mapReady = initMap();
  if (!mapReady) console.error("Leaflet failed to load — is the script tag before this file?");

  window.addEventListener("safemeds:medicine-search", (event) => {
    const { name = "", status = "idle", results = [] } = event.detail || {};
    medicineSearchName = name;
    medicineSearchStatus = status;
    medicineStockByPharmacyId = new Map(
      results
        .filter((result) =>
          result.pharmacy_id !== undefined &&
          result.pharmacy_id !== null &&
          String(result.pharmacy_id).trim() !== "",
        )
        .map((result) => [String(result.pharmacy_id), result]),
    );
    if (currentPharmacies.length) renderCards(currentPharmacies);
  });

  document.getElementById("location-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("location-search-input");
    const query = input.value.trim();
    if (!query) {
      setStatus("Enter a city or address to set your location.");
      input.focus();
      return;
    }
    searchLocation(query);
  });

  const searchInput = document.querySelector(".map-search-input");
  if (searchInput) {
    let t;
    searchInput.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        searchTerm = searchInput.value.trim();
        loadPharmacies();
      }, 300);
    });
  }

  document.getElementById("locate-btn")?.addEventListener("click", locate);
  document.getElementById("pharmacy-cards")?.addEventListener("click", (event) => {
    if (event.target.id !== "expand-search-btn") return;
    const radiusSelect = document.getElementById("search-radius");
    radiusSelect.value = String(MAX_SEARCH_RADIUS_KM);
    radiusSelect.dispatchEvent(new Event("change"));
  });
  document.getElementById("search-radius")?.addEventListener("change", (event) => {
    radiusKm = Number(event.target.value);
    if (center) {
      updateRings();
      map.fitBounds(rings[0].getBounds(), { padding: [10, 10] });
      setStatus(`Showing pharmacies within ${radiusKm} km of ${locationLabel}`);
      loadPharmacies();
    }
  });

  loadPharmacies();
});