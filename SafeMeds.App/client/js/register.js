import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getMyProfile, saveMyProfile } from "./profile-api.js";
import { uploadProfileAvatar, validateProfileAvatar } from "./avatar-upload.js?v=6";
import { attachPasswordToggles, getAuthErrorMessage, setAuthMessage, setButtonLoading } from "./auth-utils.js?v=2";

const OWNER_PATH = "../html/dashboard.html";
const CONSUMER_PATH = "landing.html";
const form = document.getElementById("register-form");
const nameInput = document.getElementById("display-name");
const roleInput = document.getElementById("account-role");
const credentialsFields = document.getElementById("credentials-fields");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const registerButton = document.getElementById("register-btn");
const googleButton = document.getElementById("google-btn");
const socialSignup = document.getElementById("social-signup");
const message = document.getElementById("auth-message");
let accountOperation = false;
let profileOnly = false;
let selectedAvatarFile = null;
let previewObjectUrl = null;

attachPasswordToggles();

function routeForRole(role) {
  window.location.replace(role === "owner" ? OWNER_PATH : CONSUMER_PATH);
}

function enableProfileCompletion(user) {
  profileOnly = true;
  credentialsFields.hidden = true;
  socialSignup.hidden = true;
  emailInput.required = false;
  passwordInput.required = false;
  confirmPasswordInput.required = false;
  emailInput.value = user.email || "";
  nameInput.value = user.displayName || user.email?.split("@")[0] || "";
  const photoPreview = document.getElementById("registration-photo-preview");
  const photoURL = user.photoURL || null;
  photoPreview.hidden = !previewObjectUrl && !photoURL;
  if (previewObjectUrl || photoURL) photoPreview.src = previewObjectUrl || photoURL;
  registerButton.textContent = "Save profile";
  document.getElementById("form-title").textContent = "Finish your SafeMeds profile";
  setAuthMessage(message, "Choose consumer or owner and complete your profile details.", "success");
}

async function routeExistingUser(user) {
  try {
    setAuthMessage(message, "Checking your SafeMeds profile…", "success");
    const profile = await getMyProfile();
    if (!profile) {
      enableProfileCompletion(user);
      return;
    }
    routeForRole(profile.role);
  } catch (error) {
    setAuthMessage(message, error.message || "Could not load your SafeMeds profile. Please try again.");
  }
}

onAuthStateChanged(auth, (user) => {
  if (user && !accountOperation) void routeExistingUser(user);
});

function profileFromForm(displayName) {
  const isOwner = roleInput.value === "owner";
  return {
    role: roleInput.value,
    display_name: displayName,
    phone: document.getElementById("phone").value.trim(),
    pharmacy_name: isOwner ? document.getElementById("pharmacy-name").value.trim() : null,
    job_title: isOwner ? document.getElementById("job-title").value.trim() : null,
    branch: isOwner ? document.getElementById("branch").value.trim() : null,
    pharmacy_address: isOwner ? document.getElementById("pharmacy-address").value.trim() : null,
  };
}

async function saveSelectedProfile(user) {
  const displayName = nameInput.value.trim() || user.displayName || user.email?.split("@")[0] || "SafeMeds user";
  if (roleInput.value === "owner" && (!document.getElementById("pharmacy-name").value.trim() || !document.getElementById("job-title").value.trim())) {
    setAuthMessage(message, "Enter your pharmacy name and your role to continue as an owner.");
    return false;
  }
  registerButton.textContent = "Saving profile…";
  setAuthMessage(message, "Saving your SafeMeds profile…", "success");
  const [profile] = await Promise.all([
    saveMyProfile(profileFromForm(displayName)),
    updateProfile(user, { displayName }),
  ]);
  if (selectedAvatarFile) {
    registerButton.textContent = "Uploading photo…";
    setAuthMessage(message, "Your profile is saved. Uploading your profile picture…", "success");
    try {
      const photoURL = await uploadProfileAvatar(selectedAvatarFile, user);
      await updateProfile(user, { photoURL });
    } catch (error) {
      selectedAvatarFile = null;
      const photoInput = document.getElementById("registration-photo-input");
      if (photoInput) photoInput.value = "";
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
      const photoStatus = document.getElementById("registration-photo-status");
      if (photoStatus) photoStatus.textContent = "PNG, JPEG, or WebP · up to 5 MB";
      enableProfileCompletion(user);
      setAuthMessage(
        message,
        `${error.message || "Your profile picture could not be uploaded."} Select it again to retry or save without a picture.`,
      );
      return false;
    }
  }
  routeForRole(profile.role);
  return true;
}

document.getElementById("registration-photo-choose")?.addEventListener("click", () => {
  document.getElementById("registration-photo-input")?.click();
});
document.getElementById("registration-photo-input")?.addEventListener("change", (event) => {
  selectedAvatarFile = event.currentTarget.files?.[0] || null;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
  const preview = document.getElementById("registration-photo-preview");
  const status = document.getElementById("registration-photo-status");
  if (selectedAvatarFile) {
    try {
      validateProfileAvatar(selectedAvatarFile);
    } catch (error) {
      selectedAvatarFile = null;
      event.currentTarget.value = "";
      const existingPhoto = auth.currentUser?.photoURL;
      preview.hidden = !existingPhoto;
      if (existingPhoto) preview.src = existingPhoto;
      else preview.removeAttribute("src");
      status.textContent = error.message;
      status.classList.add("is-error");
      return;
    }
    previewObjectUrl = URL.createObjectURL(selectedAvatarFile);
    status.textContent = selectedAvatarFile.name;
    status.classList.remove("is-error");
  } else {
    status.textContent = auth.currentUser?.photoURL
      ? "Current account photo will be kept."
      : "PNG, JPEG, or WebP · up to 5 MB";
    status.classList.remove("is-error");
  }
  const photoURL = previewObjectUrl || auth.currentUser?.photoURL;
  preview.hidden = !photoURL;
  if (photoURL) preview.src = photoURL;
  else preview.removeAttribute("src");
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthMessage(message, "");
  const displayName = nameInput.value.trim();
  const email = emailInput.value.trim();
  if (!roleInput.value) {
    setAuthMessage(message, "Choose whether you’re joining as a consumer or pharmacy owner / staff.");
    roleInput.focus();
    return;
  }
  const password = passwordInput.value;
  if (!displayName) {
    setAuthMessage(message, "Enter your name.");
    return;
  }
  if (roleInput.value === "owner" && (!document.getElementById("pharmacy-name").value.trim() || !document.getElementById("job-title").value.trim())) {
    setAuthMessage(message, "Enter your pharmacy name and your role to continue as an owner.");
    return;
  }
  if (!profileOnly && (!email || !password || !confirmPasswordInput.value)) {
    setAuthMessage(message, "Complete all fields to create your account.");
    return;
  }
  if (!profileOnly && password !== confirmPasswordInput.value) {
    setAuthMessage(message, "The passwords do not match.");
    return;
  }
  if (!profileOnly && password.length < 6) {
    setAuthMessage(message, "Use a password with at least 6 characters.");
    return;
  }

  accountOperation = true;
  setButtonLoading(registerButton, true, profileOnly ? "Saving profile…" : "Creating account…");
  try {
    let user = auth.currentUser;
    if (!profileOnly) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      user = credential.user;
      registerButton.textContent = "Finishing setup…";
      setAuthMessage(message, "Your account is ready. Finishing your SafeMeds profile…", "success");
    }
    await saveSelectedProfile(user);
  } catch (error) {
    if (auth.currentUser && !profileOnly) enableProfileCompletion(auth.currentUser);
    setAuthMessage(message, error.message || getAuthErrorMessage(error));
  } finally {
    accountOperation = false;
    setButtonLoading(registerButton, false);
    if (profileOnly) registerButton.textContent = "Save profile";
  }
});

googleButton?.addEventListener("click", async () => {
  setAuthMessage(message, "");
  if (!roleInput.value) {
    setAuthMessage(message, "Choose whether you’re joining as a consumer or pharmacy owner / staff.");
    roleInput.focus();
    return;
  }
  accountOperation = true;
  setButtonLoading(googleButton, true, "Connecting…");
  try {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    if (!nameInput.value.trim()) nameInput.value = credential.user.displayName || "";
    try {
      const existingProfile = await getMyProfile();
      if (existingProfile) {
        routeForRole(existingProfile.role);
        return;
      }
    } catch (error) {
      setAuthMessage(message, error.message);
      return;
    }
    if (roleInput.value === "owner" && (!document.getElementById("pharmacy-name").value.trim() || !document.getElementById("job-title").value.trim())) {
      enableProfileCompletion(credential.user);
      setAuthMessage(message, "Google sign-in worked. Add your pharmacy name and role, then save your profile.", "success");
      return;
    }
    await saveSelectedProfile(credential.user);
  } catch (error) {
    setAuthMessage(message, getAuthErrorMessage(error));
  } finally {
    accountOperation = false;
    setButtonLoading(googleButton, false);
  }
});
