import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const files = [
  "src/main.js",
  "server.mjs"
];

const checks = [
  {
    file: "src/main.js",
    pattern: /\bAPIMart\b|GRS AI|Atlas Cloud|速创API|\bWuyin\b|GPT Image 2|Nano Banana Pro|Seedance 2\.0|Veo 3\.1|Sora 2|Gemini Omni|Grok Imagine|External provider URLs|Provider URLs|Copy task ID|\btask id\b/i,
    message: "Front-end user copy must not expose provider/model names, provider URL hints, or upstream task IDs."
  },
  {
    file: "server.mjs",
    pattern: /currentDb\.usage\.unshift\(usage\(`(?:Queued|Failed):|creditEntry\([^)]*,\s*[^)]*,\s*[^)]*,\s*generated\.title/,
    message: "User-visible usage or credit ledger entries must use Pokaya-safe labels."
  },
  {
    file: "server.mjs",
    pattern: /app\.get\("\/api\/health"[\s\S]*?\b(?:ai|imageProvider)\s*:/,
    message: "Public health endpoint must not expose configured AI providers."
  },
  {
    file: "server.mjs",
    pattern: /res\.attachment\("project\.json"\)\.json\(findProject|res\.attachment\("result\.txt"\)[\s\S]{0,220}db\.projects/,
    message: "Export endpoints must use publicState redaction, not raw database records."
  },
  {
    file: "server.mjs",
    pattern: /return \{ publish, db: publicState/,
    message: "TikTok publish responses must not return raw request/response payloads to normal users."
  }
];

const contents = Object.fromEntries(await Promise.all(files.map(async (file) => [
  file,
  await readFile(path.join(root, file), "utf8")
])));

const failures = checks.filter((check) => check.pattern.test(contents[check.file] || ""));

if (failures.length) {
  console.error("Provider leak check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`);
  }
  process.exit(1);
}

console.log("Provider leak check passed.");
