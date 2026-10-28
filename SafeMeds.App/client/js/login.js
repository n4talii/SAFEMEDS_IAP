import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getMyProfile } from "./profile-api.js";
import { attachPasswordToggles, getAuthErrorMessage, setAuthMessage, setButtonLoading } from "./auth-utils.js?v=2";

const OWNER_PATH = "../html/dashboard.html";
const CONSUMER_PATH = "landing.html";
const PROFILE_SETUP_PATH = "register.html?completeProfile=1";
const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-btn");
const googleButton = document.getElementById("google-btn");
const resetButton = document.getElementById("reset-password-btn");
const message = document.getElementById("auth-message");
let routing = false;

attachPasswordToggles();

async function routeUser(user) {
  if (routing) return;
  routing = true;
  setAuthMessage(message, "Checking your SafeMeds profile…", "success");
  try {
    const profile = await getMyProfile();
    if (!profile) {
      window.location.replace(PROFILE_SETUP_PATH);
      return;
    }
    window.location.replace(profile.role === "owner" ? OWNER_PATH : CONSUMER_PATH);
  } catch (error) {
    routing = false;
    setAuthMessage(message, error.message || "Could not load your SafeMeds profile. Please try again.");
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) void routeUser(user);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthMessage(message, "");
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    setAuthMessage(message, "Enter your email address and password.");
    return;
  }
  setButtonLoading(loginButton, true, "Signing in…");
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await routeUser(credential.user);
  } catch (error) {
    setAuthMessage(message, getAuthErrorMessage(error));
  } finally {
    setButtonLoading(loginButton, false);
  }
});

resetButton?.addEventListener("click", async () => {
  setAuthMessage(message, "");
  const email = emailInput.value.trim();
  if (!email) {
    setAuthMessage(message, "Enter your email address first, then choose Forgot password.");
    emailInput.focus();
    return;
  }
  setButtonLoading(resetButton, true, "Sending…");
  try {
    await sendPasswordResetEmail(auth, email);
    setAuthMessage(message, "Password reset email sent. Check your inbox.", "success");
  } catch (error) {
    setAuthMessage(message, getAuthErrorMessage(error));
  } finally {
    setButtonLoading(resetButton, false);
  }
});

googleButton?.addEventListener("click", async () => {
  setAuthMessage(message, "");
  setButtonLoading(googleButton, true, "Connecting…");
  try {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    await routeUser(credential.user);
  } catch (error) {
    setAuthMessage(message, getAuthErrorMessage(error));
  } finally {
    setButtonLoading(googleButton, false);
  }
});