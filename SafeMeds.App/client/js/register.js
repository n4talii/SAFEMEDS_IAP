import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getAuthErrorMessage, setAuthMessage, setButtonLoading } from "./auth-utils.js";

const registerForm = document.getElementById("register-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const registerButton = document.getElementById("register-btn");
const googleButton = document.getElementById("google-btn");
const authMessage = document.getElementById("auth-message");

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("../html/landing.html");
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthMessage(authMessage, "");

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!email || !password || !confirmPassword) {
    setAuthMessage(authMessage, "Please fill in all fields.");
    return;
  }

  if (password !== confirmPassword) {
    setAuthMessage(authMessage, "Passwords do not match.");
    return;
  }

  if (password.length < 6) {
    setAuthMessage(authMessage, "Password must be at least 6 characters.");
    return;
  }

  setButtonLoading(registerButton, true, "Creating account…");

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    setAuthMessage(authMessage, getAuthErrorMessage(error));
  } finally {
    setButtonLoading(registerButton, false);
  }
});

googleButton?.addEventListener("click", async () => {
  setAuthMessage(authMessage, "");
  setButtonLoading(googleButton, true, "Connecting…");

  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    setAuthMessage(authMessage, getAuthErrorMessage(error));
  } finally {
    setButtonLoading(googleButton, false);
  }
});
