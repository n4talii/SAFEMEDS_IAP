const AUTH_ERRORS = {
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Could not connect. Check your internet connection and try again.",
  "auth/operation-not-allowed": "This sign-in method is not enabled for this project.",
  "auth/unauthorized-domain": "This site address is not enabled in Firebase Authentication.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/popup-blocked": "Pop-up was blocked. Allow pop-ups and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
};

export function getAuthErrorMessage(error) {
  return AUTH_ERRORS[error?.code] || error?.message || "Something went wrong. Please try again.";
}

export function setAuthMessage(element, message, type = "error") {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle("auth-error", type === "error");
  element.classList.toggle("auth-success", type === "success");
}

export function setButtonLoading(button, isLoading, loadingLabel = "Please wait…") {
  if (!button) return;
  button.disabled = isLoading;
  if (isLoading) {
    button.dataset.originalHtml = button.innerHTML;
    button.textContent = loadingLabel;
  } else if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
  }
}

export function attachPasswordToggles(root = document) {
  root.querySelectorAll("[data-password-toggle]").forEach((button) => {
    const input = document.getElementById(button.getAttribute("aria-controls"));
    if (!input) return;

    button.addEventListener("click", () => {
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      button.setAttribute("aria-pressed", String(showPassword));
      button.textContent = showPassword ? "Hide" : "Show";
      button.setAttribute("aria-label", `${showPassword ? "Hide" : "Show"} ${input.labels?.[0]?.textContent.trim().toLowerCase() || "password"}`);
    });
  });
}
