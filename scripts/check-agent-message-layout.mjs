import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mainPath = path.join(root, "src", "main.js");
const cssPath = path.join(root, "src", "styles.css");

const [main, css] = await Promise.all([
  readFile(mainPath, "utf8"),
  readFile(cssPath, "utf8")
]);

const checks = [
  {
    label: "Agent layout fixture query is defined",
    ok: main.includes('agentLayoutFixtureParam = "assistant-layout"') && main.includes("agentLayoutFixtureEnabled")
  },
  {
    label: "Agent layout fixture bypasses backend state",
    ok: main.includes("applyAgentLayoutFixture()") && main.includes("agentLayoutFixtureMessages()")
  },
  {
    label: "Fixture renders fixed long Chinese assistant copy",
    ok: main.includes("你好！我是 Pokaya Agent") && main.includes("Bleu de Chanel 洁面啫喱")
  },
  {
    label: "Fixture adds a stable DOM hook",
    ok: main.includes("agent-layout-fixture-active") && main.includes("data-agent-layout-fixture")
  },
  {
    label: "Assistant content is wrapped in a response stack",
    ok: main.includes("agent-response-stack") && /<article class="assistant"[\s\S]*agent-avatar-badge[\s\S]*agent-response-stack/.test(main)
  },
  {
    label: "CSS has the v2 layout source-of-truth block",
    ok: css.includes("Agent assistant message layout v2")
  },
  {
    label: "Assistant article is a two-column grid",
    ok: /article\.assistant[\s\S]*grid-template-columns:\s*42px minmax\(0,\s*1fr\)/.test(css)
  },
  {
    label: "Assistant article old card frame is disabled",
    ok: /article\.assistant[\s\S]*border:\s*0 !important[\s\S]*background:\s*transparent !important[\s\S]*box-shadow:\s*none !important/.test(css)
  },
  {
    label: "Assistant article cannot clip avatar/text",
    ok: /article\.assistant[\s\S]*flex:\s*0 0 auto !important/.test(css)
      && /article\.assistant[\s\S]*overflow:\s*visible !important[\s\S]*contain:\s*none !important/.test(css)
  },
  {
    label: "Avatar has fixed 42px box contract",
    ok: /agent-avatar-badge[\s\S]*width:\s*42px !important[\s\S]*min-width:\s*42px !important[\s\S]*height:\s*42px !important[\s\S]*min-height:\s*42px !important/.test(css)
  },
  {
    label: "Assistant children are pinned to the message column",
    ok: /agent-feedback-row[\s\S]*grid-column:\s*2 !important/.test(css)
  },
  {
    label: "Assistant response stack owns vertical content flow",
    ok: /agent-response-stack[\s\S]*grid-column:\s*2 !important/.test(css)
      && /agent-response-stack[\s\S]*display:\s*grid !important[\s\S]*gap:\s*12px !important/.test(css)
      && /agent-response-stack > \.agent-message[\s\S]*grid-row:\s*auto !important/.test(css)
  },
  {
    label: "Mobile contract keeps avatar fixed",
    ok: /@media \(max-width:\s*560px\)[\s\S]*grid-template-columns:\s*38px minmax\(0,\s*1fr\)/.test(css)
  }
];

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label}`);
}

if (failed.length) {
  console.error(`\nAgent message layout check failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log("\nAgent message layout contract passed.");
