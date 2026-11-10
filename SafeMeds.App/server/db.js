const path = require("path");
// Point dotenv to the .env file in the parent directory (root)
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { createClient } = require("@supabase/supabase-js");

// 1. Data Client (Inventory & Reviews)
const dataUrl = process.env.DATA_SUPABASE_URL || process.env.SUPABASE_URL;
const dataKey =
  process.env.DATA_SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY;

// 2. Auth Client (Teammate's Auth & User Profiles)
const authUrl = process.env.AUTH_SUPABASE_URL || process.env.SUPABASE_URL;
const authKey =
  process.env.AUTH_SUPABASE_SECRET_KEY ||
  process.env.AUTH_SUPABASE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY;

if (!dataUrl || !dataKey) {
  console.error("Missing DATA Supabase credentials in .env!");
}
if (!authUrl || !authKey) {
  console.error("Missing AUTH Supabase credentials in .env!");
}

const dataSupabase = createClient(dataUrl, dataKey);
const authSupabase = createClient(authUrl, authKey);

module.exports = {
  dataSupabase,
  authSupabase,
  supabase: dataSupabase, // Fallback legacy export
};
