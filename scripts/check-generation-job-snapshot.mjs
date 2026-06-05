import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = readFileSync(path.join(root, "server.mjs"), "utf8");

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Missing generation snapshot guard: ${label}`);
  }
}

function sectionBetween(start, end) {
  const startIndex = server.indexOf(start);
  const endIndex = server.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) {
    throw new Error(`Could not locate section between ${start} and ${end}`);
  }
  return server.slice(startIndex, endIndex);
}

const enqueueSection = sectionBetween("async function enqueueGeneration", "async function kickGenerationQueue");
assertIncludes(enqueueSection, "const requestedModel = cost.model;", "queued jobs capture requestedModel");
assertIncludes(enqueueSection, "requestedModel,", "queued job stores requestedModel");
assertIncludes(enqueueSection, "requestedProvider,", "queued job stores requestedProvider");
assertIncludes(enqueueSection, "providerModel: requestedProviderModel", "queued job stores providerModel");

const processSection = sectionBetween("async function processGenerationJob", "async function completeQueuedGeneration");
assertIncludes(processSection, "applyGenerationJobSnapshot(snapshot.project, snapshot.job);", "job snapshot is applied before provider execution");
const applyIndex = processSection.indexOf("applyGenerationJobSnapshot(snapshot.project, snapshot.job);");
const generateIndex = processSection.indexOf("generateWithProvider(snapshot.project");
if (applyIndex < 0 || generateIndex < 0 || applyIndex > generateIndex) {
  throw new Error("Generation snapshot must be applied before generateWithProvider");
}
assertIncludes(processSection, "job.requestedModel || job.model", "snapshot prefers requestedModel over current project model");

const completeSection = sectionBetween("async function completeQueuedGeneration", "async function failQueuedGeneration");
assertIncludes(completeSection, "const jobProject = applyGenerationJobSnapshot(structuredClone(project), job);", "completion uses job snapshot project");
assertIncludes(completeSection, "const requestedModel = job.requestedModel || job.model", "completion keeps requested model");
assertIncludes(completeSection, "const resolvedProvider = generated.resolvedProvider || generated.provider", "completion stores resolved provider");
assertIncludes(completeSection, "providerModel", "completion stores provider model");
assertIncludes(completeSection, "generationCostFor(currentDb, jobProject", "completion cost uses job snapshot");
assertIncludes(completeSection, "creditChargeFor(jobProject", "completion credits use job snapshot");

const sanitizeSection = sectionBetween("const sanitizeJob = (job) =>", "const sanitizeSchedule");
assertIncludes(sanitizeSection, "resolvedProvider: _resolvedProvider", "public state removes resolvedProvider");
assertIncludes(sanitizeSection, "providerModel: _providerModel", "public state removes providerModel");
assertIncludes(sanitizeSection, "providerFallbacks: _providerFallbacks", "public state removes providerFallbacks");

console.log("Generation job snapshot checks passed.");
