const REVIEWS_API_URL = "http://127.0.0.1:8080/api/reviews";
const INVENTORY_API_URL = "http://127.0.0.1:8080/api/inventory";

document.addEventListener("DOMContentLoaded", () => {
  const reviewBtn = document.getElementById("open-review-modal-btn");
  const closeBtn = document.getElementById("close-review-modal-btn");
  const modal = document.getElementById("review-modal");
  const productSelect = document.getElementById("review-product-select");
  const reviewForm = document.getElementById("landing-review-form");

  // 1. Fetch live medications from Supabase when opening the popup
  if (reviewBtn && modal) {
    reviewBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        const res = await fetch(INVENTORY_API_URL);
        if (res.ok) {
          const products = await res.json();
          let optionsHTML = '<option value="">Select a Medication</option>';
          products.forEach((prod) => {
            optionsHTML += `<option value="${prod.id}">${prod.item_name} (${prod.category})</option>`;
          });
          productSelect.innerHTML = optionsHTML;
        }
      } catch (err) {
        console.error("Failed to load medicines into dropdown:", err);
      }

      modal.showModal ? modal.showModal() : (modal.style.display = "block");
    });
  }

  // 2. Close modal handler
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.close ? modal.close() : (modal.style.display = "none");
    });
  }

  // 3. Submit Review Form Handler (POST to Supabase)
  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const selectedProductId = productSelect.value;
      const name = document.getElementById("reviewer-name").value;
      const rating = document.getElementById("reviewer-rating").value;
      const comments = document.getElementById("reviewer-comments").value;

      if (!selectedProductId) {
        alert("Please select a medication before submitting.");
        return;
      }

      const payload = {
        product_id: Number(selectedProductId),
        customer_name: name,
        rating: Number(rating),
        review_text: comments,
      };

      try {
        const res = await fetch(REVIEWS_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          alert("Thank you! Your review has been saved to Supabase.");
          reviewForm.reset();
          if (modal.close) modal.close();
        } else {
          const errData = await res.json();
          console.error("Supabase insert error:", errData);
          alert("Failed to save review. Check browser console for details.");
        }
      } catch (err) {
        console.error("Submit error:", err);
      }
    });
  }
});
