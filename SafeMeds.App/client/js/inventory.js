const API_URL = "http://localhost:5000/api/inventory";

//GET fetch and display inventory in the table container
async function loadInventory() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      console.err("Server returned non-array error:", data);
      return;
    }

    const container = document.getElementById("inventory-rows-container");
    if (!container) return;

    container.innerHTML = ""; //Clear existing rows

    if (data.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No inventory items found. Add some meds to get started!</div>';
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
              <span class="badge" ${badgeClass}">${item.safety_rating}</span>
            </div>
            <div class="col-action">
              <a href="#" class="edit-btn" data-id="${item.id}">Edit</a> / 
              <a href="#" class="order-btn" data-id="${item.id}">Order</a>    
            </div>            
            `;
      container.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading inventory:", error);
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
    openBtn.addEventListener("click", () =>
      modal.showModal ? modal.showModal() : (modal.style.display = "block"),
    );
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.close ? modal.close() : (modal.style.display = "none");
    });
  }

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

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMed),
        });

        const result = await res.json();

        if (res.ok) {
          addMedForm.reset();
          if (modal && modal.close) modal.close();
          loadInventory(); // This Instantly refreshes the UI with new Supabase data
        } else {
          console.error("Backend error details:", result);
        }
      } catch (err) {
        console.error("Failed to add medicine:", err);
      }
    });
  }
});
