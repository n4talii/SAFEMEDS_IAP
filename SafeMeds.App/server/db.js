const path = require("path");
// Point dotenv to the .env file in the parent directory (root)
require("dotenv").config({ path: path.join(__dirname, "../.env") });

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
