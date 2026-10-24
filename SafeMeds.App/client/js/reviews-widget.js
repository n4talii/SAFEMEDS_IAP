const DASHBOARD_REVIEWS_URL = "http://127.0.0.1:8080/api/reviews";

async function loadDashboardReviews() {
  const container = document.getElementById("reviews-list-container");
  if (!container) return;

  container.innerHTML = '<p class="empty-state">Loading reviews...</p>';

  try {
    const res = await fetch(DASHBOARD_REVIEWS_URL);

    if (!res.ok) {
      container.innerHTML =
        '<p class="empty-state">Unable to load reviews.</p>';
      return;
    }

    const reviews = await res.json();

    if (!Array.isArray(reviews)) {
      container.innerHTML = '<p class="empty-state">Invalid data received.<p>';
      return;
    }

    container.innerHTML = ""; // Clear loading state.

    if (reviews.length === 0) {
      container.innerHTML =
        '<p class="empty-state">No customer reviews yet.</p>';
      return;
    }

    reviews.slice(0, 5).forEach((rev, index) => {
      // Generate star icons based on numeric rating (1 - 5)
      const productName = rev.inventory ? rev.inventory.item_name : "Medicine";

      let starsHTML = "";
      for (let i = 1; i <= 5; i++) {
        if (i <= rev.rating) {
          starsHTML += '<i class="fa-solid fa-star star-filled"></i>';
        } else {
          starsHTML += '<i class="fa-regular fa-star"></i>';
        }
      }

      const reviewCard = document.createElement("div");
      reviewCard.className = "review-card";
      reviewCard.innerHTML = `
              <div class="review-avatar-wrapper">
                <i class="fa-solid fa-user-circle default-avatar"></i>
              </div>

              <div class="review-content-block">
                <div class="review-header-row">
                  <span class="reviewer-name">${rev.customer_name}</span>
                  <span class="rewiew-meta">${productName}</span>
                </div>

                <div class="review-stars-row">
                  ${starsHTML}
                </div>

                <p class="review-body-text">
                  ${rev.review_text || ""}
                </p>
              </div>                          
            `;
      container.appendChild(reviewCard);

      // Add horizontal divider line between review items
      if (index < Math.min(reviews.length, 5) - 1) {
        const divider = document.createElement("hr");
        divider.className = "review-divider";
        container.appendChild(divider);
      }
    });
  } catch (err) {
    console.error("Failed to render reviews widget:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboardReviews);
