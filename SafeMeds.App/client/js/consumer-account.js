import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getMyProfile, saveMyProfile } from "./profile-api.js";
import { getProfileAvatarUrl, uploadProfileAvatar, validateProfileAvatar } from "./avatar-upload.js?v=6";

const account = document.getElementById("consumer-account");
const toggle = document.getElementById("consumer-account-toggle");
const menu = document.getElementById("consumer-account-menu");
const profileDialog = document.getElementById("consumer-profile-modal");
const form = document.getElementById("consumer-profile-form");
const message = document.getElementById("consumer-profile-message");
const authLinks = document.querySelector(".consumer-auth-links");
const editProfileButton = document.getElementById("consumer-edit-profile");
const dashboardLinks = document.querySelectorAll(".owner-dashboard-link");
let currentProfile = null;
let currentAvatarUrl = null;
let selectedAvatarFile = null;
let previewObjectUrl = null;
let authStateVersion = 0;

dashboardLinks.forEach((link) => { link.hidden = true; });

function setConsumerAvatar(url) {
  const avatar = document.getElementById("consumer-account-avatar");
  if (!avatar) return;
  avatar.hidden = !url;
  if (url) avatar.src = url;
  else avatar.removeAttribute("src");
}

function setConsumerPhotoPreview(url) {
  const preview = document.getElementById("consumer-profile-photo-preview");
  if (!preview) return;
  preview.hidden = !url;
  if (url) preview.src = url;
  else preview.removeAttribute("src");
}

onAuthStateChanged(auth, async (user) => {
  const stateVersion = ++authStateVersion;
  document.body.classList.remove("auth-navigation-pending");
  currentProfile = null;
  currentAvatarUrl = user?.photoURL || null;
  if (menu) menu.hidden = true;
  toggle?.setAttribute("aria-expanded", "false");
  if (!user) {
    if (account) account.hidden = true;
    if (authLinks) authLinks.hidden = false;
    return;
  }

  if (account) account.hidden = false;
  if (authLinks) authLinks.hidden = true;
  const accountName = document.getElementById("consumer-account-name");
  if (accountName) accountName.textContent = user.displayName || user.email || "Signed-in account";
  const accountLabel = document.getElementById("consumer-account-label");
  if (accountLabel) accountLabel.textContent = user.displayName || "My account";
  setConsumerAvatar(currentAvatarUrl);
  if (editProfileButton) editProfileButton.hidden = true;

  getProfileAvatarUrl(user).then((storedAvatarUrl) => {
    if (stateVersion !== authStateVersion || auth.currentUser?.uid !== user.uid) return;
    currentAvatarUrl = storedAvatarUrl || user.photoURL || null;
    setConsumerAvatar(currentAvatarUrl);
  }).catch((error) => {
    if (error?.code !== "storage/object-not-found") {
      console.error("Could not load the saved profile picture", error);
    }
  });

  try {
    const profile = await getMyProfile();
    if (stateVersion !== authStateVersion || auth.currentUser?.uid !== user.uid) return;
    if (!profile) return;
    currentProfile = profile;
    if (accountName) accountName.textContent = profile.display_name || user.email || "Signed-in account";
    if (accountLabel) accountLabel.textContent = profile.display_name || "My account";
    dashboardLinks.forEach((link) => { link.hidden = profile.role !== "owner"; });
    if (editProfileButton) editProfileButton.hidden = false;
    if (profile.role !== "consumer") return;
    setConsumerPhotoPreview(currentAvatarUrl);
    const nameInput = document.getElementById("consumer-profile-name");
    const emailInput = document.getElementById("consumer-profile-email");
    const phoneInput = document.getElementById("consumer-profile-phone");
    if (nameInput) nameInput.value = profile.display_name || user.displayName || "";
    if (emailInput) emailInput.value = user.email || "";
    if (phoneInput) phoneInput.value = profile.phone || "";
  } catch (error) {
    console.error("Could not load consumer profile", error);
  }
}, (error) => {
  console.error("Could not determine authentication state for consumer navigation", error);
  document.body.classList.remove("auth-navigation-pending");
  if (account) account.hidden = true;
  if (authLinks) authLinks.hidden = false;
});

toggle?.addEventListener("click", () => {
  if (!menu) return;
  menu.hidden = !menu.hidden;
  toggle.setAttribute("aria-expanded", String(!menu.hidden));
});
document.addEventListener("click", (event) => {
  if (account && !account.contains(event.target) && menu && !menu.hidden) {
    menu.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
  }
});
function resetConsumerPhotoSelection() {
  selectedAvatarFile = null;
  const input = document.getElementById("consumer-profile-photo");
  if (input) input.value = "";
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
  setConsumerPhotoPreview(currentAvatarUrl || auth.currentUser?.photoURL);
  const status = document.getElementById("consumer-profile-photo-status");
  if (status) {
    status.textContent = currentAvatarUrl || auth.currentUser?.photoURL ? "Current photo will be kept unless you choose another." : "PNG, JPEG, or WebP · up to 5 MB";
    status.classList.remove("is-error");
  }
}

document.getElementById("consumer-edit-profile")?.addEventListener("click", () => {
  menu.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  if (currentProfile?.role === "owner") {
    window.location.assign("../html/dashboard.html?editProfile=1");
    return;
  }
  if (auth.currentUser && currentProfile) {
    document.getElementById("consumer-profile-name").value = currentProfile.display_name || "";
    document.getElementById("consumer-profile-phone").value = currentProfile.phone || "";
    resetConsumerPhotoSelection();
    profileDialog.showModal();
  }
});
document.getElementById("consumer-profile-cancel")?.addEventListener("click", () => {
  resetConsumerPhotoSelection();
  profileDialog.close();
});
document.getElementById("consumer-profile-photo-choose")?.addEventListener("click", () => {
  document.getElementById("consumer-profile-photo")?.click();
});
document.getElementById("consumer-profile-photo")?.addEventListener("change", (event) => {
  selectedAvatarFile = event.currentTarget.files?.[0] || null;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
  const status = document.getElementById("consumer-profile-photo-status");
  if (selectedAvatarFile) {
    try {
      validateProfileAvatar(selectedAvatarFile);
    } catch (error) {
      selectedAvatarFile = null;
      event.currentTarget.value = "";
      setConsumerPhotoPreview(currentAvatarUrl || auth.currentUser?.photoURL);
      if (status) {
        status.textContent = error.message;
        status.classList.add("is-error");
      }
      return;
    }
    if (status) {
      status.textContent = selectedAvatarFile.name;
      status.classList.remove("is-error");
    }
  }
  previewObjectUrl = selectedAvatarFile ? URL.createObjectURL(selectedAvatarFile) : null;
  setConsumerPhotoPreview(previewObjectUrl || currentAvatarUrl || auth.currentUser?.photoURL);
});
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  const displayName = document.getElementById("consumer-profile-name").value.trim();
  if (!displayName) {
    message.hidden = false;
    message.textContent = "Enter your name to save your profile.";
    return;
  }
  submit.disabled = true;
  submit.textContent = "Saving…";
  message.hidden = true;
  try {
    const [profile, photoURL] = await Promise.all([
      saveMyProfile({
        role: "consumer",
        display_name: displayName,
        phone: document.getElementById("consumer-profile-phone").value.trim(),
      }),
      selectedAvatarFile
        ? uploadProfileAvatar(selectedAvatarFile, auth.currentUser)
        : Promise.resolve(auth.currentUser.photoURL),
    ]);
    await updateProfile(auth.currentUser, {
      displayName,
      ...(photoURL ? { photoURL } : {}),
    });
    currentProfile = profile;
    currentAvatarUrl = photoURL || null;
    document.getElementById("consumer-account-name").textContent = displayName;
    document.getElementById("consumer-account-label").textContent = displayName;
    setConsumerAvatar(currentAvatarUrl);
    setConsumerPhotoPreview(currentAvatarUrl);
    selectedAvatarFile = null;
    document.getElementById("consumer-profile-photo").value = "";
    const photoStatus = document.getElementById("consumer-profile-photo-status");
    if (photoStatus) {
      photoStatus.textContent = photoURL ? "Profile picture updated." : "PNG, JPEG, or WebP · up to 5 MB";
      photoStatus.classList.remove("is-error");
    }
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
    form.reset();
    profileDialog.close();
  } catch (error) {
    message.hidden = false;
    message.textContent = error.message || "Could not save your profile. Please try again.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Save profile";
  }
});
document.getElementById("consumer-logout")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await signOut(auth);
    window.location.replace("signup.html");
  } catch (error) {
    button.disabled = false;
    console.error("Could not log out", error);
  }
});
