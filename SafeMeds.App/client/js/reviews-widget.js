const DASHBOARD_REVIEWS_URL = "http://127.0.0.1:8080/api/reviews";

async function loadDashboardReviews() {
  const container = document.getElementById("reviews-list-container");
  if (!container) return;

  try {
    const response = await fetch(DASHBOARD_REVIEWS_URL);
    const reviews = await response.json();
    if (!response.ok || !Array.isArray(reviews)) {
      throw new Error("Review service returned an invalid response");
    }

    container.replaceChildren();
    if (!reviews.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No customer reviews yet.";
      container.appendChild(empty);
      return;
    }

    reviews.slice(0, 5).forEach((review, index) => {
      const card = document.createElement("div");
      card.className = "review-item";
      const avatar = document.createElement("div");
      avatar.className = "review-avatar-wrapper";
      avatar.innerHTML = '<i class="fa-solid fa-user-circle default-avatar" aria-hidden="true"></i>';
      const content = document.createElement("div");
      content.className = "review-content-block";
      const header = document.createElement("div");
      header.className = "review-header-row";
      const customer = document.createElement("span");
      customer.className = "reviewer-name";
      customer.textContent = review.customer_name || "Customer";
      const product = document.createElement("span");
      product.className = "rewiew-meta";
      product.textContent = review.inventory?.item_name || "Medicine";
      header.append(customer, product);
      const stars = document.createElement("div");
      stars.className = "review-stars-row";
      const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
      for (let star = 1; star <= 5; star += 1) {
        const icon = document.createElement("i");
        icon.className = star <= rating ? "fa-solid fa-star star-filled" : "fa-regular fa-star";
        icon.setAttribute("aria-hidden", "true");
        stars.appendChild(icon);
      }
      const text = document.createElement("p");
      text.className = "review-body-text";
      text.textContent = review.review_text || "No written comment.";
      content.append(header, stars, text);
      card.append(avatar, content);
      container.appendChild(card);
      if (index < Math.min(reviews.length, 5) - 1) {
        const divider = document.createElement("hr");
        divider.className = "review-divider";
        container.appendChild(divider);
      }
    });
  } catch (error) {
    console.error("Failed to render dashboard reviews:", error);
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "Reviews could not load. Check that the server is running.";
    container.replaceChildren(message);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboardReviews);