import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const main = readFileSync(path.join(root, "src/main.js"), "utf8");

function sectionBetween(start, end) {
  const startIndex = main.indexOf(start);
  const endIndex = main.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Could not locate section between ${start} and ${end}`);
  return main.slice(startIndex, endIndex);
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) throw new Error(`Missing result metadata guard: ${label}`);
}

function assertNotIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) throw new Error(`Unexpected result metadata fallback: ${label}`);
}

const modelSection = sectionBetween("function resultModelLabel", "function normalizedResultTitle");
assertIncludes(modelSection, "item.requestedModel || job?.requestedModel || item.model", "details prefer the generated model snapshot over current model");
assertIncludes(modelSection, "QWEN IMAGE 2.0", "Qwen results render as Qwen instead of falling through to GPT");

const displaySection = sectionBetween("function resultModelDisplay", "function resultModelProvider");
assertIncludes(displaySection, "Qwen Image 2.0", "Qwen model display label exists");

const resolutionSection = sectionBetween("function resultResolutionLabel", "function resultAspectRatioLabel");
assertIncludes(resolutionSection, "resultOriginJob(item)", "resolution can read the generation job snapshot");
assertNotIncludes(resolutionSection, "resultProject(item)?.image?.resolution", "resolution must not fall back to the current project setting");

const aspectSection = sectionBetween("function resultAspectRatioLabel", "const supportedWallAspectRatios");
assertIncludes(aspectSection, "resultOriginJob(item)", "aspect ratio can read the generation job snapshot");
assertIncludes(aspectSection, "return \"Unknown\";", "missing result ratio is explicit instead of pretending to be current toolbar ratio");

const wallSection = sectionBetween("function wallAspectRatioForItem", "function resultMediaRatio");
assertIncludes(wallSection, "job?.aspectRatio", "wall layout can use the generation snapshot when result aspect ratio is absent");

console.log("Result metadata snapshot checks passed.");
