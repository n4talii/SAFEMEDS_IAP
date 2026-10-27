const express = require("express");
const supabase = require("../db");

const router = express.Router();
const FIREBASE_LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";
const MAX_TEXT = 120;

async function requireFirebaseUser(req, res, next) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const token = req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!apiKey) return res.status(503).json({ error: "Firebase profile verification is not configured on the server." });
  if (!token) return res.status(401).json({ error: "Sign in to continue." });

  try {
    const response = await fetch(`${FIREBASE_LOOKUP_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });
    const result = await response.json();
    const user = result.users?.[0];
    if (!response.ok || !user?.localId) {
      return res.status(401).json({ error: "Your sign-in session could not be verified. Please sign in again." });
    }
    req.firebaseUser = user;
    next();
  } catch {
    res.status(502).json({ error: "Could not verify your sign-in right now. Please try again." });
  }
}

router.get("/me", requireFirebaseUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("firebase_uid, role, display_name, email, phone, pharmacy_name, job_title, branch, pharmacy_address, created_at, updated_at")
      .eq("firebase_uid", req.firebaseUser.localId)
      .maybeSingle();
    if (error) throw error;
    res.json({ profile: data || null });
  } catch {
    res.status(500).json({ error: "Could not load your profile." });
  }
});

router.put("/me", requireFirebaseUser, async (req, res) => {
  const { role, display_name, phone, pharmacy_name, job_title, branch, pharmacy_address } = req.body || {};
  const clean = (value, max = MAX_TEXT) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const profileRole = role;
  const name = clean(display_name, 80);
  const pharmacy = clean(pharmacy_name, 120);
  const title = clean(job_title, 80);
  if (!["consumer", "owner"].includes(profileRole)) {
    return res.status(400).json({ error: "Choose consumer or owner." });
  }
  if (!name) return res.status(400).json({ error: "Enter your name." });
  if (profileRole === "owner" && (!pharmacy || !title)) {
    return res.status(400).json({ error: "Pharmacy name and your job title are required for an owner profile." });
  }

  const profile = {
    firebase_uid: req.firebaseUser.localId,
    role: profileRole,
    display_name: name,
    email: clean(req.firebaseUser.email, 254),
    phone: clean(phone, 32) || null,
    pharmacy_name: profileRole === "owner" ? pharmacy : null,
    job_title: profileRole === "owner" ? title : null,
    branch: profileRole === "owner" ? clean(branch, 120) || null : null,
    pharmacy_address: profileRole === "owner" ? clean(pharmacy_address, 240) || null : null,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(profile, { onConflict: "firebase_uid" })
      .select("firebase_uid, role, display_name, email, phone, pharmacy_name, job_title, branch, pharmacy_address, created_at, updated_at")
      .single();
    if (error) throw error;
    res.json({ profile: data });
  } catch {
    res.status(500).json({ error: "Could not save your profile. Check the profile table and server database settings." });
  }
});

module.exports = router;