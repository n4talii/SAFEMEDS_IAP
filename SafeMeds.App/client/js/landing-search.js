const MEDICINE_SEARCH_API_URL = `${window.SAFEMEDS_API_BASE || "http://localhost:8080"}/api/meditrac/medications/search`;

(() => {
  const input = document.getElementById("medicine-search");
  const button = document.getElementById("medicine-search-btn");
  const inStockOnly = document.getElementById("in-stock-only");
  const resultsList = document.getElementById("medicine-results");
  if (!input || !resultsList) return;

  function setLoadingState(isLoading) {
    if (button) button.disabled = isLoading;
    button?.setAttribute("aria-busy", String(isLoading));
  }

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);

  let timer;
  let latestRequest = 0;
  let currentLocation = null;
  let activeController = null;

  function cancelPendingSearch() {
    activeController?.abort();
    activeController = null;
  }

  function publishMapStock(name, status, rows = []) {
    const results = rows.map(({ pharmacy, source }) => {
      const stockRecord = { ...source, ...pharmacy };
      const stockQuantity = firstValue(
        stockRecord.stock_quantity,
        stockRecord.quantity_available,
        stockRecord.stock,
        stockRecord.quantity,
        stockRecord.current_stock,
      );
      return {
        pharmacy_id: firstValue(pharmacy.pharmacy_id, source.pharmacy_id),
        stock_label: formatStock(stockRecord),
        in_stock: firstValue(stockRecord.in_stock, stockRecord.inStock),
        stock_quantity: stockQuantity,
        stock_unit: firstValue(stockRecord.unit, source.unit),
      };
    });
    window.dispatchEvent(new CustomEvent("safemeds:medicine-search", {
      detail: { name, status, results },
    }));
  }

  window.addEventListener("safemeds:locationchange", (event) => {
    const { lat, lng } = event.detail || {};
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      currentLocation = { lat: Number(lat), lng: Number(lng) };
      if (input.value.trim().length >= 2) search();
    }
  });

  function showMessage(message) {
    resultsList.innerHTML = `<li class="search-msg" role="option">${esc(message)}</li>`;
    resultsList.hidden = false;
  }

  function getResultRows(payload) {
    let records = Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object"
        ? payload.results || payload.data || payload.medications || payload.items || []
        : [];
    if (!Array.isArray(records) && records && typeof records === "object") {
      records = records.results || records.medications || records.items || [];
    }

    if (!Array.isArray(records)) return [];

    return records.flatMap((record) => {
      if (!record || typeof record !== "object") return [];
      const medicine =
        record.medicine || record.medication || record.product || record;
      const pharmacies =
        record.pharmacies || record.locations || record.availability || record.offers;

      if (Array.isArray(pharmacies) && pharmacies.length) {
        return pharmacies.map((pharmacy) => ({
          medicine,
          pharmacy:
            pharmacy?.pharmacy || pharmacy?.location || pharmacy || record,
          source: record,
        }));
      }

      return [{ medicine, pharmacy: record, source: record }];
    });
  }

  function firstValue(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
  }

  function calculateDistanceKm(latitude, longitude) {
    if (!currentLocation || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return undefined;
    }

    const radians = (degrees) => (degrees * Math.PI) / 180;
    const lat1 = radians(currentLocation.lat);
    const lat2 = radians(Number(latitude));
    const deltaLat = lat2 - lat1;
    const deltaLng = radians(Number(longitude)) - radians(currentLocation.lng);
    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatStock(pharmacy) {
    const inStock = firstValue(pharmacy.in_stock, pharmacy.inStock);
    const stock = firstValue(
      pharmacy.stock_quantity,
      pharmacy.quantity_available,
      pharmacy.stock,
      pharmacy.quantity,
      pharmacy.current_stock,
    );
    if (typeof stock === "number" || (typeof stock === "string" && stock.trim())) {
      if (!Number.isNaN(Number(stock))) {
        return Number(stock) > 0 ? `${stock} available` : "Out of stock";
      }
      return String(stock);
    }
    if (typeof inStock === "boolean") return inStock ? "In stock" : "Out of stock";
    return "Stock not provided";
  }

  function resultMarkup({ medicine, pharmacy, source }) {
    const medicineName = firstValue(
      medicine.medicine_name,
      medicine.medication_name,
      medicine.drug_name,
      medicine.item_name,
      medicine.name,
      medicine.product_name,
    );
    const pharmacyName = firstValue(
      pharmacy.pharmacy_name,
      pharmacy.pharmacy,
      pharmacy.vendor_name,
      pharmacy.name,
      pharmacy.pharmacyName,
      source.pharmacy_name,
      source.pharmacyName,
    );
    const price = firstValue(
      pharmacy.price,
      pharmacy.price_kes,
      pharmacy.price_amount,
      pharmacy.unit_price,
      source.price,
      medicine.price,
    );
    const currency = firstValue(
      pharmacy.currency,
      pharmacy.currency_code,
      source.currency,
      medicine.currency,
    );
    const distance = firstValue(
      pharmacy.distance_km,
      pharmacy.distanceKm,
      pharmacy.distance,
      source.distance_km,
      source.distanceKm,
      source.distance,
      medicine.distance_km,
      calculateDistanceKm(
        firstValue(pharmacy.latitude, pharmacy.lat, source.latitude, source.lat),
        firstValue(pharmacy.longitude, pharmacy.lng, source.longitude, source.lng),
      ),
    );
    const category = firstValue(medicine.category, medicine.strength, medicine.form);
    const stockQuantity = firstValue(
      pharmacy.stock_quantity,
      pharmacy.quantity_available,
      pharmacy.stock,
      pharmacy.quantity,
      pharmacy.current_stock,
    );
    const stock = formatStock(pharmacy);
    const stockUnit = firstValue(pharmacy.unit, source.unit);
    const stockText =
      stockQuantity !== undefined && stockUnit && Number(stockQuantity) > 0
        ? `${stockQuantity} ${stockUnit} available`
        : stock;
    const stockClass =
      pharmacy.in_stock === false ||
      pharmacy.inStock === false ||
      (stockQuantity !== undefined && Number(stockQuantity) <= 0)
        ? "out"
        : "in";
    const distanceText =
      distance === undefined
        ? "Not provided"
        : `${esc(distance)}${typeof distance === "number" ? " km" : ""}`;

    return `
      <li class="search-item search-result-card" role="option">
        <div class="search-result-heading">
          <strong>${esc(medicineName || "Medicine")}</strong>
          ${category ? `<span class="search-cat">${esc(category)}</span>` : ""}
        </div>
        <div class="search-result-details">
          <span><strong>Pharmacy</strong>${esc(pharmacyName || "Not provided")}</span>
          <span><strong>Price</strong>${price === undefined ? "Not provided" : `${currency ? `${esc(currency)} ` : ""}${esc(price)}`}</span>
          <span><strong>Stock</strong><span class="stock-badge ${stockClass}">${esc(stockText)}</span></span>
          <span><strong>Distance</strong>${distanceText}</span>
        </div>
      </li>`;
  }

  async function search() {
    const name = input.value.trim();
    if (name.length < 2) {
      cancelPendingSearch();
      setLoadingState(false);
      resultsList.hidden = true;
      publishMapStock("", "idle");
      return;
    }

    const requestId = ++latestRequest;
    cancelPendingSearch();
    activeController = new AbortController();
    setLoadingState(true);
    showMessage("Searching nearby pharmacies…");
    publishMapStock(name, "loading");

    const params = new URLSearchParams({ name, limit: "6" });
    if (currentLocation) {
      params.set("lat", currentLocation.lat);
      params.set("lng", currentLocation.lng);
      const radius = document.getElementById("search-radius")?.value;
      if (radius) params.set("radius_km", radius);
    }
    if (inStockOnly?.checked) params.set("in_stock", "true");

    try {
      const response = await fetch(`${MEDICINE_SEARCH_API_URL}?${params}`, {
        signal: activeController.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (requestId !== latestRequest || activeController.signal.aborted) return;

      const rows = getResultRows(payload);
      publishMapStock(name, "ready", rows);
      if (!rows.length) {
        showMessage(`No matching pharmacies found for “${name}”.`);
        return;
      }

      resultsList.innerHTML = rows.slice(0, 6).map(resultMarkup).join("");
      resultsList.hidden = false;
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Medicine search failed:", error.message);
      if (requestId === latestRequest) {
        publishMapStock(name, "unavailable");
        showMessage("Medicine search is unavailable right now. Please try again.");
      }
    } finally {
      if (requestId === latestRequest) {
        activeController = null;
        setLoadingState(false);
      }
    }
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(search, 300);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(timer);
      search();
    }
    if (event.key === "Escape") resultsList.hidden = true;
  });
  button?.addEventListener("click", search);
  inStockOnly?.addEventListener("change", search);
  document.getElementById("search-radius")?.addEventListener("change", () => {
    if (input.value.trim().length >= 2) search();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".hero-search")) resultsList.hidden = true;
  });
})();
