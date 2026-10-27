import { auth } from "./firebase-config.js";

const PROFILE_ENDPOINT = `${window.SAFEMEDS_API_BASE || "http://127.0.0.1:8080"}/api/profiles/me`;

async function profileRequest(method, profile) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to continue.");
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(PROFILE_ENDPOINT, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(profile ? { "Content-Type": "application/json" } : {}),
      },
      ...(profile ? { body: JSON.stringify(profile) } : {}),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The profile service took too long to respond. Check that the SafeMeds server is running, then try again.");
    }
    if (error instanceof TypeError) {
      throw new Error("Could not connect to the SafeMeds profile service. Start the server at http://localhost:8080 and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not reach the profile service.");
  return result.profile || null;
}

export function getMyProfile() {
  return profileRequest("GET");
}

export function saveMyProfile(profile) {
  return profileRequest("PUT", profile);
}