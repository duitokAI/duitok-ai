const els = {
  apiBaseUrl: document.querySelector("#apiBaseUrl"),
  saveSettings: document.querySelector("#saveSettings"),
  refreshJobs: document.querySelector("#refreshJobs"),
  status: document.querySelector("#status"),
  jobs: document.querySelector("#jobs")
};

function setStatus(message) {
  els.status.textContent = message || "";
}

function textFromJob(job) {
  return [job.caption, job.hashtags].filter(Boolean).join("\n\n").trim();
}

async function storageGet(keys) {
  return chrome.storage.sync.get(keys);
}

async function storageSet(value) {
  return chrome.storage.sync.set(value);
}

async function api(path, options = {}) {
  const { apiBaseUrl } = await storageGet(["apiBaseUrl"]);
  const base = (apiBaseUrl || "http://localhost:4173").replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `Request failed (${res.status})`);
  return payload;
}

function renderJobs(jobs) {
  if (!jobs.length) {
    els.jobs.innerHTML = "<p>No scheduled TikTok jobs yet.</p>";
    return;
  }
  els.jobs.innerHTML = jobs.map((job) => `
    <article class="job" data-job-id="${job.id}">
      <strong>${job.title}</strong>
      <small>${job.platform} · ${job.time || "No time"} · ${job.status}</small>
      <code>${textFromJob(job) || "No caption yet."}</code>
      <div class="job-actions">
        <button class="primary" data-open="${job.id}">Open TikTok</button>
        <button data-fill="${job.id}">Fill Caption</button>
        <button data-copy="${job.id}">Copy</button>
        <button data-posted="${job.id}">Mark Posted</button>
      </div>
    </article>
  `).join("");

  els.jobs.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => chrome.runtime.sendMessage({ type: "openUpload" }));
  });
  els.jobs.querySelectorAll("[data-fill]").forEach((btn) => {
    btn.addEventListener("click", () => fillActiveTab(jobs.find((job) => job.id === btn.dataset.fill)));
  });
  els.jobs.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const job = jobs.find((item) => item.id === btn.dataset.copy);
      await navigator.clipboard.writeText(textFromJob(job));
      setStatus("Caption copied.");
    });
  });
  els.jobs.querySelectorAll("[data-posted]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/api/autopost/jobs/${btn.dataset.posted}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Posted" })
      });
      setStatus("Marked as posted in Pokaya.");
      await loadJobs();
    });
  });
}

async function fillActiveTab(job) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes("tiktok.com")) {
    setStatus("Open a TikTok upload tab first.");
    return;
  }
  const response = await chrome.tabs.sendMessage(tab.id, { type: "applyJob", job }).catch((error) => ({ ok: false, message: error.message }));
  setStatus(response?.message || "Caption sent to TikTok tab.");
}

async function loadJobs() {
  try {
    setStatus("Loading Pokaya queue...");
    const { jobs } = await api("/api/autopost/jobs");
    renderJobs(jobs.filter((job) => job.platform === "TikTok" && job.status !== "Posted"));
    setStatus(`${jobs.length} jobs loaded.`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function boot() {
  const { apiBaseUrl } = await storageGet(["apiBaseUrl"]);
  els.apiBaseUrl.value = apiBaseUrl || "http://localhost:4173";
  els.saveSettings.addEventListener("click", async () => {
    await storageSet({ apiBaseUrl: els.apiBaseUrl.value.trim() || "http://localhost:4173" });
    setStatus("Settings saved.");
  });
  els.refreshJobs.addEventListener("click", loadJobs);
  await loadJobs();
}

boot();
