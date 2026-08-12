(function initializeShared(globalScope) {
  "use strict";

  const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"]);
  const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "3gp", "3gpp"]);

  function sanitizeSegment(value, fallback = "media") {
    const cleaned = String(value || "")
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/g, "")
      .slice(0, 80);

    return cleaned || fallback;
  }

  function dateOnly(value) {
    const match = String(value || "").match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "undated";
  }

  function extensionFor(url, kind) {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
      const candidate = match ? match[1].toLowerCase() : "";
      if (kind === "video" && VIDEO_EXTENSIONS.has(candidate)) return candidate;
      if (kind === "photo" && IMAGE_EXTENSIONS.has(candidate)) return candidate;
    } catch (_) {
      // The URL is validated separately. Use a conservative fallback here.
    }
    return kind === "video" ? "mp4" : "jpg";
  }

  function monthWindows(startDate, endDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) {
      return [];
    }

    const windows = [];
    const startMonth = startDate.slice(0, 7);
    let year = Number(endDate.slice(0, 4));
    let month = Number(endDate.slice(5, 7));

    for (let count = 0; count < 240; count += 1) {
      const monthText = `${year}-${String(month).padStart(2, "0")}`;
      const first = `${monthText}-01`;
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const last = `${monthText}-${String(lastDay).padStart(2, "0")}`;
      windows.push({
        from: startDate > first ? startDate : first,
        to: endDate < last ? endDate : last
      });

      if (monthText === startMonth) break;
      month -= 1;
      if (month === 0) {
        month = 12;
        year -= 1;
      }
    }
    return windows;
  }

  function validateMediaUrl(rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "https:") return false;
      if (parsed.username || parsed.password) return false;
      if (!parsed.hostname || parsed.hostname === "localhost") return false;
      if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(parsed.hostname)) return false;
      return true;
    } catch (_) {
      return false;
    }
  }

  function mediaUrlKind(url) {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      const match = pathname.match(/\.([a-z0-9]{2,5})$/);
      const extension = match ? match[1] : "";
      if (IMAGE_EXTENSIONS.has(extension)) return "photo";
      if (VIDEO_EXTENSIONS.has(extension)) return "video";
      return null;
    } catch (_) {
      return null;
    }
  }

  function scoreMediaCandidate(path, url, kind) {
    const key = path.toLowerCase();
    const value = url.toLowerCase();
    const detectedKind = mediaUrlKind(url);

    if (/(avatar|profile|logo|icon|signature|badge)/.test(key + " " + value)) return -Infinity;
    if (detectedKind && detectedKind !== kind) return -Infinity;
    if (kind === "photo" && /video/.test(key)) return -Infinity;
    if (kind === "video" && !detectedKind && !/(video|movie)/.test(key)) return -Infinity;

    let score = 0;
    if (/(original|orig)/.test(key)) score += 120;
    if (/download/.test(key)) score += 110;
    if (/(full|hires|hi_res|highres)/.test(key)) score += 100;
    if (/large/.test(key)) score += 80;
    if (kind === "video" && /video_file/.test(key)) score += 90;
    if (/main/.test(key)) score += 55;
    if (/(photo|image|video|media|attachment)/.test(key)) score += 25;
    if (detectedKind === kind) score += 20;
    if (/(original|full|large|hires|highres)/.test(value)) score += 15;
    if (/(thumb|thumbnail|small|medium|mini|preview|tiny|low)/.test(key)) score -= 150;
    if (/(thumb|thumbnail|small|preview|tiny)/.test(value)) score -= 50;
    return score;
  }

  function findBestMediaUrl(media, kind) {
    const candidates = [];
    const seen = new Set();

    function visit(value, path, depth) {
      if (depth > 5 || value == null) return;
      if (typeof value === "string") {
        if (!validateMediaUrl(value) || seen.has(value)) return;
        seen.add(value);
        const score = scoreMediaCandidate(path, value, kind);
        if (Number.isFinite(score)) candidates.push({ url: value, score });
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item, index) => visit(item, `${path}[${index}]`, depth + 1));
        return;
      }
      if (typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => visit(item, `${path}.${key}`, depth + 1));
      }
    }

    visit(media, "media", 0);
    candidates.sort((left, right) => right.score - left.score);
    return candidates[0] ? candidates[0].url : null;
  }

  function extractMedia(activity) {
    const type = String(activity && activity.activity_type || "");
    const media = activity && (activity.activiable || activity.activable);
    if (!media || typeof media !== "object") return null;

    let kind;
    if (type === "video_activity" || media.is_video === true) {
      kind = "video";
    } else if (type === "photo_activity") {
      kind = "photo";
    } else {
      return null;
    }

    const url = findBestMediaUrl(media, kind);
    if (!validateMediaUrl(url)) return null;
    return {
      kind,
      url,
      id: String(media.id || activity.id || "media"),
      date: dateOnly(media.created_at || activity.created_at || activity.activity_datetime)
    };
  }

  function historyKey(childId, activity, media) {
    const activityId = String(activity && activity.id || "activity");
    return `${sanitizeSegment(childId, "child")}:${sanitizeSegment(activityId, "activity")}:${sanitizeSegment(media.id, "media")}`;
  }

  function filenameFor(childName, media) {
    const child = sanitizeSegment(childName, "Child");
    const month = /^\d{4}-\d{2}/.test(media.date) ? media.date.slice(0, 7) : "undated";
    const id = sanitizeSegment(media.id, "media");
    const extension = extensionFor(media.url, media.kind);
    return `Procare Family Media/${child}/${month}/${media.date}_${id}.${extension}`;
  }

  globalScope.ProcareSafe = Object.freeze({
    dateOnly,
    extensionFor,
    extractMedia,
    findBestMediaUrl,
    filenameFor,
    historyKey,
    monthWindows,
    sanitizeSegment,
    validateMediaUrl
  });
})(globalThis);
