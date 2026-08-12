(function initializeProcareDownloader() {
  "use strict";

  const API_BASE = "https://api-school.procareconnect.com/api/web";
  const MAX_PAGES_PER_CHILD = 1000;
  const DOWNLOAD_PAUSE_MS = 100;
  const PAGE_PAUSE_MS = 250;
  let activeRun = null;

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function parseJson(value) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }

  function getAuthContext() {
    const raw = localStorage.getItem("persist:kinderlime");
    const persisted = parseJson(raw);
    if (!persisted) throw new Error("Your Procare sign-in could not be read. Refresh Procare and try again.");

    let token = null;
    let schoolId = null;
    for (const key of ["currentUser", "tenant"]) {
      const section = typeof persisted[key] === "string" ? parseJson(persisted[key]) : persisted[key];
      if (!section || typeof section !== "object") continue;
      token = token || section.data && section.data.auth_token || section.auth_token;
      schoolId = schoolId || section.data && section.data.current_school && section.data.current_school.id;
    }

    if (!token || typeof token !== "string") {
      throw new Error("No active Procare sign-in was found. Sign in again and retry.");
    }
    return { token, schoolId: schoolId ? String(schoolId) : null };
  }

  function authHeaders(context) {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${context.token}`
    };
    if (context.schoolId) {
      headers["X-SITE-ID"] = `PCO:SITE:${context.schoolId}`;
      headers["X-APP-ID"] = "PCO";
      headers["X-CLIENT-NAME"] = "Web";
    }
    return headers;
  }

  async function apiGet(path, context) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: authHeaders(context),
      credentials: "omit",
      cache: "no-store"
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error("Procare rejected the current sign-in. Refresh the page and sign in again.");
    }
    if (!response.ok) throw new Error(`Procare returned error ${response.status}.`);
    return response.json();
  }

  async function listChildren() {
    let context = getAuthContext();
    try {
      const data = await apiGet("/parent/kids/", context);
      const kids = Array.isArray(data) ? data : data.kids || data.data && data.data.kids || [];
      return kids
        .filter((kid) => kid && kid.id != null)
        .map((kid) => ({
          id: String(kid.id),
          name: kid.name || kid.full_name || [kid.first_name, kid.last_name].filter(Boolean).join(" ") || "Child"
        }));
    } finally {
      context.token = null;
    }
  }

  function validateOptions(options) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!options || !datePattern.test(options.startDate) || !datePattern.test(options.endDate)) {
      throw new Error("Choose a valid start and end date.");
    }
    if (options.startDate > options.endDate) throw new Error("The start date must come before the end date.");
    if (!options.includePhotos && !options.includeVideos) throw new Error("Choose photos, videos, or both.");
  }

  async function setStatus(patch) {
    const current = (await chrome.storage.local.get("runStatus")).runStatus || {};
    await chrome.storage.local.set({
      runStatus: {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString()
      }
    });
  }

  async function requestDownload(url, filename) {
    return chrome.runtime.sendMessage({ type: "DOWNLOAD_MEDIA", url, filename });
  }

  async function flushHistory(history) {
    await chrome.storage.local.set({ downloadedItems: history });
  }

  async function runDownload(options, control) {
    validateOptions(options);
    let context = getAuthContext();
    const children = await listChildren();
    const selected = options.childId === "all"
      ? children
      : children.filter((child) => child.id === String(options.childId));

    if (selected.length === 0) throw new Error("The selected child is not available to this Procare account.");

    const stored = await chrome.storage.local.get("downloadedItems");
    const history = stored.downloadedItems && typeof stored.downloadedItems === "object"
      ? stored.downloadedItems
      : {};
    let dirtyHistory = 0;
    const counts = { found: 0, downloaded: 0, skipped: 0, failed: 0 };

    await setStatus({ state: "running", message: "Starting…", counts });

    try {
      for (const child of selected) {
        if (control.cancelled) break;
        for (const dateWindow of ProcareSafe.monthWindows(options.startDate, options.endDate)) {
          if (control.cancelled) break;
          const seenPageSignatures = new Set();

          for (let page = 1; page <= MAX_PAGES_PER_CHILD; page += 1) {
            if (control.cancelled) break;
            await setStatus({
              state: "running",
              message: `Checking ${child.name}, ${dateWindow.from} to ${dateWindow.to}, page ${page}…`,
              counts: { ...counts }
            });

            const query = new URLSearchParams({
              kid_id: child.id,
              "filters[daily_activity][date_from]": dateWindow.from,
              "filters[daily_activity][date_to]": dateWindow.to,
              page: String(page)
            });
            const payload = await apiGet(`/parent/daily_activities/?${query.toString()}`, context);
            const activities = payload && payload.daily_activities;
            if (!Array.isArray(activities) || activities.length === 0) break;

            const signature = activities.map((item) => item && item.id).join("|");
            if (seenPageSignatures.has(signature)) break;
            seenPageSignatures.add(signature);

            for (const activity of activities) {
              if (control.cancelled) break;
              const media = ProcareSafe.extractMedia(activity);
              if (!media) continue;
              if (media.kind === "photo" && !options.includePhotos) continue;
              if (media.kind === "video" && !options.includeVideos) continue;

              counts.found += 1;
              const key = ProcareSafe.historyKey(child.id, activity, media);
              if (history[key]) {
                counts.skipped += 1;
                continue;
              }

              const filename = ProcareSafe.filenameFor(child.name, media);
              const result = await requestDownload(media.url, filename);
              if (result && result.ok) {
                counts.downloaded += 1;
                history[key] = { downloadedAt: new Date().toISOString() };
                dirtyHistory += 1;
              if (dirtyHistory >= 1) {
                await flushHistory(history);
                dirtyHistory = 0;
                }
              } else {
                counts.failed += 1;
              }

              await setStatus({
                state: "running",
                message: `Saving ${child.name}…`,
                counts: { ...counts }
              });
              await delay(DOWNLOAD_PAUSE_MS);
            }
            await delay(PAGE_PAUSE_MS);
          }
        }
      }

      if (dirtyHistory > 0) await flushHistory(history);
      await setStatus({
        state: control.cancelled ? "cancelled" : "complete",
        message: control.cancelled ? "Cancelled." : "Finished.",
        counts: { ...counts }
      });
    } finally {
      context.token = null;
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return false;

    if (message.type === "PING") {
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "GET_CHILDREN") {
      listChildren()
        .then((children) => sendResponse({ ok: true, children }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message.type === "START_DOWNLOAD") {
      if (activeRun) {
        sendResponse({ ok: false, error: "A download is already running in this tab." });
        return false;
      }
      const control = { cancelled: false };
      activeRun = control;
      runDownload(message.options, control)
        .catch((error) => setStatus({ state: "error", message: error.message }))
        .finally(() => { activeRun = null; });
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === "CANCEL_DOWNLOAD") {
      if (activeRun) activeRun.cancelled = true;
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });
})();
