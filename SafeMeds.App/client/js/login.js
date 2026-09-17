import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getAuthErrorMessage, setAuthMessage, setButtonLoading } from "./auth-utils.js";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-btn");
const googleButton = document.getElementById("google-btn");
const authMessage = document.getElementById("auth-message");

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("../html/landing.html");
  }
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthMessage(authMessage, "");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    setAuthMessage(authMessage, "Please enter your email and password.");
    return;
  }

  setButtonLoading(loginButton, true, "Signing in…");

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    setAuthMessage(authMessage, getAuthErrorMessage(error));
  } finally {
    setButtonLoading(loginButton, false);
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
