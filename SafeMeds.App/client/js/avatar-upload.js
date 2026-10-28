import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";
import { reload } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { app } from "./firebase-config.js";

const storage = getStorage(app);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 512;
const AVATAR_UPLOAD_TIMEOUT_MS = 20_000;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateProfileAvatar(file) {
  if (!file) throw new Error("Choose a profile picture first.");
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    throw new Error("Choose a PNG, JPEG, or WebP image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Choose an image smaller than 5 MB.");
  }
}

async function prepareProfileAvatar(file) {
  if (typeof createImageBitmap !== "function") {
    return { blob: file, contentType: file.type };
  }

  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare your profile picture. Please try another image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => result
          ? resolve(result)
          : reject(new Error("Could not prepare your profile picture. Please try another image.")),
        "image/webp",
        0.82,
      );
    });
    return { blob, contentType: blob.type || "image/webp" };
  } finally {
    image.close();
  }
}

export async function uploadProfileAvatar(file, user) {
  if (!file || !user?.uid) throw new Error("Choose a profile picture first.");
  validateProfileAvatar(file);

  const { blob, contentType } = await prepareProfileAvatar(file);
  const uploadId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const avatarRef = ref(storage, `user-avatars/${user.uid}/avatar`);
  const uploadTask = uploadBytesResumable(avatarRef, blob, {
    contentType,
    cacheControl: "private,no-cache,max-age=0,must-revalidate",
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Profile picture upload timed out. Your profile is saved; select the picture again to retry or save without it."));
      uploadTask.cancel();
    }, AVATAR_UPLOAD_TIMEOUT_MS);
    uploadTask.on(
      "state_changed",
      undefined,
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
      () => {
        clearTimeout(timeout);
        resolve();
      },
    );
  });
  const downloadURL = await getDownloadURL(avatarRef);
  const cacheBuster = `v=${encodeURIComponent(uploadId)}`;
  return `${downloadURL}${downloadURL.includes("?") ? "&" : "?"}${cacheBuster}`;
}

export function getProfileAvatarUrl(user) {
  if (!user?.uid) return Promise.resolve(null);
  const withCacheBuster = (url) => {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${Date.now()}`;
  };
  return getDownloadURL(ref(storage, `user-avatars/${user.uid}/avatar`))
    .catch(async (storageError) => {
      await reload(user);
      if (user.photoURL) return user.photoURL;
      throw storageError;
    })
    .then(withCacheBuster);
}
