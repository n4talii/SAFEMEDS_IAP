const supabase = require("./db");

async function checkConnection() {
  console.log("Checking Supabase connection...");
  const { data, error } = await supabase.from("inventory").select("*");

  if (error) {
    console.error("❌ Supabase Error:", error.message);
  } else {
    console.log("✅ Supabase Connected! Rows retrieved:", data.length);
    console.log("Sample Data:", data);
  }
}

checkConnection();
