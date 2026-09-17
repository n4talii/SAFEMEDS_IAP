import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const LOGIN_PATH = "../html/signup.html";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace(LOGIN_PATH);
  }
});

const logoutButton = document.getElementById("logout-btn");
logoutButton?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace(LOGIN_PATH);
});
