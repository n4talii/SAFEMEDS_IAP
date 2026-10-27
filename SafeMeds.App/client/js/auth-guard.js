import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getMyProfile, saveMyProfile } from "./profile-api.js";
import { getProfileAvatarUrl, uploadProfileAvatar, validateProfileAvatar } from "./avatar-upload.js?v=6";

const LOGIN_PATH = "../html/signup.html";
const PROFILE_SETUP_PATH = "../html/register.html?completeProfile=1";
const profileModal = document.getElementById("profile-edit-modal");
let activeProfile = null;
let activeAvatarUrl = null;
let selectedAvatarFile = null;
let previewObjectUrl = null;

function fillProfileForm(user, profile) {
  document.getElementById("profile-name").value = profile.display_name || user.displayName || "";
  document.getElementById("profile-email").value = user.email || "";
  document.getElementById("profile-phone").value = profile.phone || "";
  document.getElementById("profile-pharmacy-name").value = profile.pharmacy_name || "";
  document.getElementById("profile-job-title").value = profile.job_title || "";
  document.getElementById("profile-branch").value = profile.branch || "";
  document.getElementById("profile-address").value = profile.pharmacy_address || "";
  const preview = document.getElementById("profile-photo-preview");
  const photoURL = activeAvatarUrl || user.photoURL;
  if (preview) {
    preview.hidden = !photoURL;
    if (photoURL) preview.src = photoURL;
    else preview.removeAttribute("src");
  }
  const photoInput = document.getElementById("profile-photo-input");
  if (photoInput) photoInput.value = "";
  const photoStatus = document.getElementById("profile-photo-status");
  if (photoStatus) {
    photoStatus.textContent = photoURL ? "Current photo will be kept unless you choose another." : "PNG, JPEG, or WebP · up to 5 MB";
    photoStatus.classList.remove("is-error");
  }
  selectedAvatarFile = null;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace(LOGIN_PATH);
    return;
  }
  activeAvatarUrl = user.photoURL || null;
  const avatar = document.querySelector(".profile-avatar");
  if (avatar && activeAvatarUrl) {
    avatar.src = activeAvatarUrl;
    avatar.hidden = false;
  }
  getProfileAvatarUrl(user).then((url) => {
    if (auth.currentUser?.uid !== user.uid) return;
    activeAvatarUrl = url;
    if (avatar) {
      avatar.src = url;
      avatar.hidden = false;
    }
    const preview = document.getElementById("profile-photo-preview");
    if (preview && !selectedAvatarFile) {
      preview.src = url;
      preview.hidden = false;
    }
  }).catch((error) => {
    if (error?.code !== "storage/object-not-found") {
      console.error("Could not load the saved profile picture", error);
    }
  });
  try {
    activeProfile = await getMyProfile();
    if (!activeProfile) {
      window.location.replace(PROFILE_SETUP_PATH);
      return;
    }
    if (activeProfile.role !== "owner") {
      window.location.replace("landing.html");
      return;
    }
    const profileName = document.getElementById("dashboard-user-name");
    if (profileName) profileName.textContent = activeProfile.display_name || user.email || "Pharmacy account";
    fillProfileForm(user, activeProfile);
    document.body.dataset.authenticated = "true";
    if (new URLSearchParams(window.location.search).get("editProfile") === "1") {
      window.history.replaceState(null, "", window.location.pathname);
      profileModal?.showModal();
    }
  } catch (error) {
    window.showDashboardToast?.(`${error.message} Check the profile table and server settings.`);
  }
});

document.querySelector("[data-open-profile]")?.addEventListener("click", () => {
  document.getElementById("settings-menu").hidden = true;
  document.querySelector(".settings-menu-toggle")?.setAttribute("aria-expanded", "false");
  if (auth.currentUser && activeProfile) fillProfileForm(auth.currentUser, activeProfile);
  profileModal?.showModal();
});
document.querySelector("[data-close-profile]")?.addEventListener("click", () => profileModal?.close());
document.getElementById("profile-photo-choose")?.addEventListener("click", () => {
  document.getElementById("profile-photo-input")?.click();
});
document.getElementById("profile-photo-input")?.addEventListener("change", (event) => {
  selectedAvatarFile = event.currentTarget.files?.[0] || null;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
  const photoStatus = document.getElementById("profile-photo-status");
  if (selectedAvatarFile) {
    try {
      validateProfileAvatar(selectedAvatarFile);
    } catch (error) {
      selectedAvatarFile = null;
      event.currentTarget.value = "";
      const preview = document.getElementById("profile-photo-preview");
      if (preview) {
        const photoURL = activeAvatarUrl || auth.currentUser?.photoURL;
        preview.hidden = !photoURL;
        if (photoURL) preview.src = photoURL;
        else preview.removeAttribute("src");
      }
      if (photoStatus) {
        photoStatus.textContent = error.message;
        photoStatus.classList.add("is-error");
      }
      return;
    }
    if (photoStatus) {
      photoStatus.textContent = selectedAvatarFile.name;
      photoStatus.classList.remove("is-error");
    }
  }
  previewObjectUrl = selectedAvatarFile ? URL.createObjectURL(selectedAvatarFile) : null;
  const preview = document.getElementById("profile-photo-preview");
  if (preview) {
    const url = previewObjectUrl || activeAvatarUrl || auth.currentUser?.photoURL;
    preview.hidden = !url;
    if (url) preview.src = url;
    else preview.removeAttribute("src");
  }
});
document.getElementById("profile-edit-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const saveButton = event.currentTarget.querySelector('[type="submit"]');
  const message = document.getElementById("profile-edit-message");
  const displayName = document.getElementById("profile-name").value.trim();
  const pharmacyName = document.getElementById("profile-pharmacy-name").value.trim();
  const jobTitle = document.getElementById("profile-job-title").value.trim();
  if (!displayName || !pharmacyName || !jobTitle) {
    message.hidden = false;
    message.textContent = "Name, pharmacy name, and your role are required.";
    return;
  }
  saveButton.disabled = true;
  saveButton.dataset.originalText = saveButton.textContent;
  saveButton.textContent = "Saving…";
  message.hidden = true;
  try {
    const [profile, photoURL] = await Promise.all([
      saveMyProfile({
        role: "owner",
        display_name: displayName,
        phone: document.getElementById("profile-phone").value.trim(),
        pharmacy_name: pharmacyName,
        job_title: jobTitle,
        branch: document.getElementById("profile-branch").value.trim(),
        pharmacy_address: document.getElementById("profile-address").value.trim(),
      }),
      selectedAvatarFile
        ? uploadProfileAvatar(selectedAvatarFile, auth.currentUser)
        : Promise.resolve(auth.currentUser.photoURL),
    ]);
    await updateProfile(auth.currentUser, {
      displayName,
      ...(photoURL ? { photoURL } : {}),
    });
    activeProfile = profile;
    activeAvatarUrl = photoURL || null;
    const avatar = document.querySelector(".profile-avatar");
    if (avatar) {
      avatar.hidden = !photoURL;
      if (photoURL) avatar.src = photoURL;
      else avatar.removeAttribute("src");
    }
    document.getElementById("dashboard-user-name").textContent = profile.display_name;
    selectedAvatarFile = null;
    document.getElementById("profile-photo-input").value = "";
    const photoStatus = document.getElementById("profile-photo-status");
    if (photoStatus) {
      photoStatus.textContent = photoURL ? "Profile picture updated." : "PNG, JPEG, or WebP · up to 5 MB";
      photoStatus.classList.remove("is-error");
    }
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
    profileModal.close();
    window.showDashboardToast?.("Profile saved to SafeMeds.");
  } catch (error) {
    message.hidden = false;
    message.textContent = error.message;
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = saveButton.dataset.originalText || "Save profile";
  }
});

const logoutButton = document.getElementById("logout-btn");
logoutButton?.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await signOut(auth);
    window.location.replace(LOGIN_PATH);
  } catch (error) {
    logoutButton.disabled = false;
    window.showDashboardToast?.(error.message || "Could not log out. Please try again.");
  }
});