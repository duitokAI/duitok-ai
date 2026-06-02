import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "public/models/agent/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const modelPath = path.join(root, "public", manifest.primaryModel.replace(/^\//, ""));

const report = {
  manifest: fs.existsSync(manifestPath),
  model: fs.existsSync(modelPath),
  modelPath: manifest.primaryModel,
  requiredAnimations: manifest.requiredAnimations || []
};

if (!report.model) {
  console.log(JSON.stringify({ ...report, status: "missing-production-glb" }, null, 2));
  process.exit(0);
}

function parseGlbJson(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("utf8", 0, 4) !== "glTF") throw new Error("Invalid GLB header");
  let offset = 12;
  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.toString("utf8", offset + 4, offset + 8);
    const chunkStart = offset + 8;
    if (chunkType === "JSON") {
      return JSON.parse(buffer.toString("utf8", chunkStart, chunkStart + chunkLength));
    }
    offset = chunkStart + chunkLength;
  }
  throw new Error("Missing GLB JSON chunk");
}

const sizeMb = fs.statSync(modelPath).size / 1024 / 1024;
const gltf = parseGlbJson(modelPath);
const animationNames = (gltf.animations || []).map((item) => item.name).filter(Boolean);
const missingAnimations = report.requiredAnimations.filter((name) => !animationNames.includes(name));
const status = missingAnimations.length
  ? "missing-required-animations"
  : sizeMb <= manifest.budgets.maxPrimaryGlbSizeMb
    ? "ok"
    : "too-large";

console.log(JSON.stringify({
  ...report,
  sizeMb: Number(sizeMb.toFixed(2)),
  animationNames,
  missingAnimations,
  status
}, null, 2));

if (status !== "ok") process.exit(1);
