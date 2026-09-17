const AUTH_ERRORS = {
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
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
    button.dataset.originalLabel = button.textContent;
    button.textContent = loadingLabel;
  } else if (button.dataset.originalLabel) {
    button.textContent = button.dataset.originalLabel;
  }
}
