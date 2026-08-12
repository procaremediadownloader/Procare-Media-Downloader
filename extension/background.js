"use strict";

importScripts("shared.js");

const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

function waitForDownload(downloadId, sendResponse) {
  let finished = false;
  let timeoutId;

  const finish = (response) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeoutId);
    chrome.downloads.onChanged.removeListener(onChanged);
    sendResponse(response);
  };

  const onChanged = (delta) => {
    if (!delta || delta.id !== downloadId || !delta.state) return;
    if (delta.state.current === "complete") {
      finish({ ok: true, downloadId });
    } else if (delta.state.current === "interrupted") {
      finish({
        ok: false,
        error: delta.error && delta.error.current || "Chrome interrupted the download."
      });
    }
  };

  chrome.downloads.onChanged.addListener(onChanged);
  chrome.downloads.search({ id: downloadId }, (items) => {
    if (chrome.runtime.lastError || !items || !items[0]) return;
    if (items[0].state === "complete") {
      finish({ ok: true, downloadId });
    } else if (items[0].state === "interrupted") {
      finish({ ok: false, error: items[0].error || "Chrome interrupted the download." });
    }
  });
  timeoutId = setTimeout(() => {
    finish({ ok: false, error: "The download did not finish within 10 minutes." });
  }, DOWNLOAD_TIMEOUT_MS);
}

function isAuthorizedSender(sender) {
  try {
    const url = new URL(sender.tab && sender.tab.url || sender.url || "");
    return url.protocol === "https:" && url.hostname === "schools.procareconnect.com";
  } catch (_) {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "DOWNLOAD_MEDIA") return false;

  if (!isAuthorizedSender(sender)) {
    sendResponse({ ok: false, error: "Download request did not come from Procare." });
    return false;
  }

  if (!ProcareSafe.validateMediaUrl(message.url)) {
    sendResponse({ ok: false, error: "Procare supplied an invalid media URL." });
    return false;
  }

  const filename = String(message.filename || "")
    .split("/")
    .map((part) => ProcareSafe.sanitizeSegment(part, "media"))
    .join("/");

  chrome.downloads.download(
    {
      url: message.url,
      filename,
      conflictAction: "uniquify",
      saveAs: false
    },
    (downloadId) => {
      if (chrome.runtime.lastError || typeof downloadId !== "number") {
        sendResponse({
          ok: false,
          error: chrome.runtime.lastError ? chrome.runtime.lastError.message : "Chrome rejected the download."
        });
        return;
      }
      waitForDownload(downloadId, sendResponse);
    }
  );

  return true;
});
