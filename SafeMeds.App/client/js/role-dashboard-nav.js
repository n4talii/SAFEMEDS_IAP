import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { getMyProfile } from "./profile-api.js";

const dashboardLinks = document.querySelectorAll(".owner-dashboard-link");

onAuthStateChanged(auth, async (user) => {
  dashboardLinks.forEach((link) => { link.hidden = true; });
  if (!user) return;

  try {
    const profile = await getMyProfile();
    if (profile?.role === "owner") {
      dashboardLinks.forEach((link) => { link.hidden = false; });
    }
  } catch (error) {
    console.error("Could not determine dashboard navigation access", error);
  }
});
