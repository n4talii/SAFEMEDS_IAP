import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getProfileAvatarUrl } from "./avatar-upload.js?v=6";

const authLinks = document.querySelector(".public-auth-links");
const accountControls = document.querySelector(".signed-in-nav");
const accountName = document.getElementById("signed-in-nav-name");
const accountAvatar = document.querySelector(".signed-in-nav-avatar");
const logoutButton = document.getElementById("signed-in-nav-logout");
let authStateVersion = 0;

onAuthStateChanged(auth, (user) => {
  const stateVersion = ++authStateVersion;
  if (authLinks) authLinks.hidden = Boolean(user);
  if (accountControls) accountControls.hidden = !user;
  if (accountName) accountName.textContent = user?.displayName || user?.email || "";
  if (accountAvatar) {
    accountAvatar.hidden = !user?.photoURL;
    if (user?.photoURL) accountAvatar.src = user.photoURL;
    else accountAvatar.removeAttribute("src");
  }
  if (user && accountAvatar) {
    getProfileAvatarUrl(user).then((url) => {
      if (stateVersion !== authStateVersion || auth.currentUser?.uid !== user.uid) return;
      accountAvatar.src = url;
      accountAvatar.hidden = false;
    }).catch((error) => {
      if (error?.code !== "storage/object-not-found") {
        console.error("Could not load the saved profile picture", error);
      }
    });
  }
  document.body.classList.remove("auth-navigation-pending");
}, (error) => {
  authStateVersion += 1;
  console.error("Could not determine authentication state for navigation", error);
  if (authLinks) authLinks.hidden = false;
  if (accountControls) accountControls.hidden = true;
  if (accountAvatar) {
    accountAvatar.hidden = true;
    accountAvatar.removeAttribute("src");
  }
  document.body.classList.remove("auth-navigation-pending");
});

logoutButton?.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Could not log out from navigation", error);
    logoutButton.disabled = false;
  }
});
