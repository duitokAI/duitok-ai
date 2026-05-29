chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    apiBaseUrl: "http://localhost:4173",
    finalPostClick: false
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "openUpload") return false;
  chrome.tabs.create({ url: "https://www.tiktok.com/upload" }, (tab) => {
    sendResponse({ ok: true, tabId: tab?.id });
  });
  return true;
});
