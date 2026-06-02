import "dotenv/config";

const required = [
  "PUBLIC_APP_URL",
  "CHIP_API_TOKEN",
  "CHIP_BRAND_ID",
  "CHIP_PUBLIC_KEY"
];

let ok = true;

for (const key of required) {
  const value = process.env[key];
  const missing = !value || value.includes("replace_with") || value.includes("your_");
  console.log(`${missing ? "MISSING" : "OK"} ${key}`);
  if (missing) ok = false;
}

if (!ok) {
  console.error("\nCHIP config is incomplete. Fill .env locally or Render Environment Variables in cloud.");
  process.exit(1);
}

console.log("\nCHIP config looks ready.");
