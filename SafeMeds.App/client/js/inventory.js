const API_URL = "http://127.0.0.1:8080/api/inventory";
let currentInventory = [];

//GET fetch and display inventory in the table container
async function loadInventory() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Server error (${res.status}):`, errorText);
      window.showDashboardToast?.("Inventory could not load. Check that the server is running.");
      return;
    }
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      console.error("Server returned non-array error:", data);
      return;
    }

    currentInventory = data;
    const container = document.getElementById("inventory-rows-container");
    if (!container) return;

    container.innerHTML = ""; //Clear existing rows

    if (data.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No items found. Add some meds to get started!</div>';
      return;
    }

    data.forEach((item) => {
      const badgeClass = `badge-${(item.safety_rating || "").toLowerCase()}`;
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
            <input class="metric-checkbox" type="checkbox" />
            <div class="col-name">${item.item_name}</div>
            <div class="col-sku">${item.sku}</div>
            <div class="col-cat">${item.category}</div>
            <div class="col-stock">${item.current_stock}</div>
            <div class="col-reorder">${item.reorder_point}</div>
            <div class="col-restocked">${item.last_restocked || "N/A"}</div>
            <div class="col-rating">
              <span class="badge ${badgeClass}">${item.safety_rating}</span>
            </div>
            <div class="col-action">
              <a href="#" class="edit-btn" data-id="${item.id}">Edit</a> / 
              <button type="button" class="order-btn" data-id="${item.id}">Order</button>
            </div>            
            `;
      container.appendChild(row);
    });
    document.dispatchEvent(new CustomEvent("inventory:loaded"));
  } catch (err) {
    console.error("Error loading inventory:", err);
    window.showDashboardToast?.("Inventory could not load. Check that the server is running.");
  }
}

// Attach listener to the "Add Meds" form submit event
document.addEventListener("DOMContentLoaded", () => {
  //Load initial table rows
  loadInventory();

  //Modal Dialog Controls
  const modal = document.getElementById("add-med-modal");
  const openBtn = document.getElementById("open-add-modal-btn");
  const closeBtn = document.getElementById("close-modal-btn");
  const addMedForm = document.getElementById("add-med-form");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => {
      addMedForm.reset();
      const idEl = document.getElementById("med-id");
      if (idEl) idEl.value = "";

      const title = document.getElementById("modal-title");
      if (title) title.textContent = "Add New Medicine";

      modal.showModal ? modal.showModal() : (modal.style.display = "block");
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.close ? modal.close() : (modal.style.display = "none");
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-btn")) {
      e.preventDefault();

      const itemId = e.target.getAttribute("data-id");
      const item = currentInventory.find((i) => String(i.id) == String(itemId));

      if (!item) return;

      const idEl = document.getElementById("med-id");
      if (idEl) idEl.value = item.id;

      document.getElementById("med-id").value = item.id;
      document.getElementById("med-name").value = item.item_name || "";
      document.getElementById("med-sku").value = item.sku || "";
      document.getElementById("med-category").value = item.category || "";
      document.getElementById("med-stock").value = item.current_stock || 0;
      document.getElementById("med-reorder").value = item.reorder_point || 0;
      document.getElementById("med-restocked").value =
        item.last_restocked || "";
      document.getElementById("med-rating").value =
        item.safety_rating || "Safe";

      const title = document.getElementById("modal-title");
      if (title) title.textContent = "Edit Medicine";

      if (modal)
        modal.showModal ? modal.showModal() : (modal.style.display = "block");
    }
  });

  // Single Controlled POST Submit Handler
  if (addMedForm) {
    addMedForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameEl = document.getElementById("med-name");
      const skuEl = document.getElementById("med-sku");
      const catEl = document.getElementById("med-category");
      const stockEl = document.getElementById("med-stock");
      const reorderEl = document.getElementById("med-reorder");
      const restockedEl = document.getElementById("med-restocked");
      const ratingEl = document.getElementById("med-rating");

      const idEl = document.getElementById("med-id");
      const editId = idEl ? idEl.value : "";
      const isEdit = Boolean(editId);

      // Verify all elements are found in DOM
      if (
        !nameEl ||
        !skuEl ||
        !catEl ||
        !stockEl ||
        !reorderEl ||
        !restockedEl ||
        !ratingEl
      ) {
        console.error(
          "One or more form input IDs do not match the HTML elements!",
        );
        return;
      }

      const newMed = {
        item_name: document.getElementById("med-name")?.value || "",
        sku: parseInt(document.getElementById("med-sku")?.value, 10) || 0,
        category: document.getElementById("med-category")?.value || "",
        current_stock:
          parseInt(document.getElementById("med-stock")?.value, 10) || 0,
        reorder_point:
          parseInt(document.getElementById("med-reorder")?.value, 10) || 0,
        last_restocked: document.getElementById("med-restocked")?.value || null,
        safety_rating: document.getElementById("med-rating")?.value || "Safe",
      };

      const targetUrl = isEdit ? `${API_URL}/${editId}` : API_URL;
      const httpMethod = isEdit ? "PUT" : "POST";

      try {
        const res = await fetch(targetUrl, {
          method: httpMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMed),
        });

        const result = await res.json();

        if (res.ok) {
          addMedForm.reset();
          if (idEl) idEl.value = "";
          if (modal && modal.close) modal.close();
          loadInventory(); // Refresh the table after save
          window.showDashboardToast?.(isEdit ? "Medicine updated." : "Medicine added.");
        } else {
          console.error("Backend error details:", result);
          window.showDashboardToast?.("Could not save this medicine. Check that the server is running and try again.");
        }
      } catch (err) {
        console.error("Failed to save medicine:", err);
        window.showDashboardToast?.("Could not reach the inventory server.");
      }
    });
  }
});
