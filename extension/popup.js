"use strict";

const elements = {
  cancel: document.getElementById("cancel"),
  child: document.getElementById("child"),
  clearHistory: document.getElementById("clear-history"),
  downloaded: document.getElementById("downloaded"),
  endDate: document.getElementById("end-date"),
  error: document.getElementById("error"),
  failed: document.getElementById("failed"),
  infoView: document.getElementById("info-view"),
  mainView: document.getElementById("main-view"),
  moreInfo: document.getElementById("more-info"),
  photos: document.getElementById("photos"),
  progress: document.getElementById("progress"),
  setup: document.getElementById("setup"),
  skipped: document.getElementById("skipped"),
  start: document.getElementById("start"),
  startDate: document.getElementById("start-date"),
  statusMessage: document.getElementById("status-message"),
  videos: document.getElementById("videos"),
  backToMain: document.getElementById("back-to-main")
};

let activeTabId = null;

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setError(message = "") {
  elements.error.textContent = message;
}

async function sendToTab(message) {
  if (!activeTabId) throw new Error("Open Procare in the current tab first.");
  try {
    return await chrome.tabs.sendMessage(activeTabId, message);
  } catch (_) {
    throw new Error("Open or refresh schools.procareconnect.com, then try again.");
  }
}

function renderStatus(status) {
  if (!status || !status.state || status.state === "idle") return;
  const running = status.state === "running";
  elements.progress.hidden = false;
  elements.setup.hidden = running;
  elements.cancel.hidden = !running;
  elements.statusMessage.textContent = status.message || status.state;
  const counts = status.counts || {};
  elements.downloaded.textContent = counts.downloaded || 0;
  elements.skipped.textContent = counts.skipped || 0;
  elements.failed.textContent = counts.failed || 0;
  if (status.state === "error") setError(status.message || "The download failed.");
}

async function loadChildren() {
  const response = await sendToTab({ type: "GET_CHILDREN" });
  if (!response || !response.ok) throw new Error(response && response.error || "Could not load children from Procare.");

  elements.child.textContent = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All children";
  elements.child.appendChild(all);
  for (const child of response.children) {
    const option = document.createElement("option");
    option.value = child.id;
    option.textContent = child.name;
    elements.child.appendChild(option);
  }
  elements.child.disabled = false;
  elements.start.disabled = response.children.length === 0;
}

async function initialize() {
  const today = new Date();
  const fiveYearsAgo = new Date(today);
  fiveYearsAgo.setFullYear(today.getFullYear() - 5);
  elements.startDate.value = localDate(fiveYearsAgo);
  elements.endDate.value = localDate(today);

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id || !/^https:\/\/schools\.procareconnect\.com\//.test(tab.url || "")) {
    throw new Error("Open schools.procareconnect.com and sign in before using this extension.");
  }
  activeTabId = tab.id;
  await sendToTab({ type: "PING" });
  await loadChildren();
  const stored = await chrome.storage.local.get("runStatus");
  renderStatus(stored.runStatus);
}

elements.start.addEventListener("click", async () => {
  setError();
  const options = {
    childId: elements.child.value,
    startDate: elements.startDate.value,
    endDate: elements.endDate.value,
    includePhotos: elements.photos.checked,
    includeVideos: elements.videos.checked
  };

  try {
    const response = await sendToTab({ type: "START_DOWNLOAD", options });
    if (!response || !response.ok) throw new Error(response && response.error || "Could not start the download.");
    renderStatus({ state: "running", message: "Starting…", counts: {} });
  } catch (error) {
    setError(error.message);
  }
});

elements.cancel.addEventListener("click", async () => {
  elements.cancel.disabled = true;
  try {
    await sendToTab({ type: "CANCEL_DOWNLOAD" });
    elements.statusMessage.textContent = "Cancelling after the current file…";
  } catch (error) {
    setError(error.message);
  } finally {
    elements.cancel.disabled = false;
  }
});

elements.clearHistory.addEventListener("click", async () => {
  if (!confirm("Clear the local list used to avoid duplicate downloads? Existing files will not be deleted.")) return;
  await chrome.storage.local.remove(["downloadedItems", "runStatus"]);
  elements.progress.hidden = true;
  elements.setup.hidden = false;
  setError("Local download history cleared.");
});

elements.moreInfo.addEventListener("click", () => {
  elements.mainView.hidden = true;
  elements.infoView.hidden = false;
});

elements.backToMain.addEventListener("click", () => {
  elements.infoView.hidden = true;
  elements.mainView.hidden = false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.runStatus) renderStatus(changes.runStatus.newValue);
});

initialize().catch((error) => setError(error.message));
