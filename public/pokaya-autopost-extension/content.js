const POKAYA_PANEL_ID = "pokaya-autopost-panel";

function textFromJob(job) {
  return [job.caption, job.hashtags].filter(Boolean).join("\n\n").trim();
}

function visible(el) {
  const box = el.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

function findCaptionTarget() {
  const candidates = [
    ...document.querySelectorAll("textarea"),
    ...document.querySelectorAll("[contenteditable='true']")
  ];
  return candidates.find((el) => visible(el) && /caption|describe|post|video|title/i.test([
    el.getAttribute("aria-label"),
    el.getAttribute("placeholder"),
    el.dataset?.e2e,
    el.closest("[data-e2e]")?.dataset?.e2e
  ].filter(Boolean).join(" "))) || candidates.find(visible);
}

function setNativeValue(el, value) {
  el.focus();
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, "value")?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  el.textContent = value;
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  return true;
}

async function applyJob(job) {
  const target = findCaptionTarget();
  const text = textFromJob(job);
  await navigator.clipboard?.writeText(text).catch(() => {});
  if (!target) return { ok: false, message: "Caption box not found. Caption copied to clipboard." };
  setNativeValue(target, text);
  return { ok: true, message: "Caption filled. Select/upload your video, review, then post manually." };
}

function panelHtml() {
  return `
    <div class="pokaya-card">
      <strong>Pokaya Auto Post</strong>
      <p>Open the extension popup, choose a queue item, then come back here to fill caption.</p>
      <small>Review before publishing. Pokaya does not bypass TikTok login, captcha, or final confirmation.</small>
    </div>`;
}

function installPanel() {
  if (document.getElementById(POKAYA_PANEL_ID)) return;
  const panel = document.createElement("aside");
  panel.id = POKAYA_PANEL_ID;
  panel.innerHTML = panelHtml();
  const style = document.createElement("style");
  style.textContent = `
    #${POKAYA_PANEL_ID} {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483647;
      width: 270px;
      font-family: Inter, Arial, sans-serif;
      color: #111827;
    }
    #${POKAYA_PANEL_ID} .pokaya-card {
      display: grid;
      gap: 8px;
      padding: 14px;
      border: 1px solid rgba(255, 110, 25, 0.35);
      border-radius: 10px;
      background: #fffaf3;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
    }
    #${POKAYA_PANEL_ID} strong { font-size: 15px; }
    #${POKAYA_PANEL_ID} p,
    #${POKAYA_PANEL_ID} small { margin: 0; line-height: 1.35; }
    #${POKAYA_PANEL_ID} small { color: #6b7280; }
  `;
  document.documentElement.append(style, panel);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "applyJob") {
    applyJob(message.job).then(sendResponse);
    return true;
  }
  return false;
});

installPanel();
