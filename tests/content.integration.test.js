"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const extensionDir = path.join(__dirname, "..", "extension");
const listeners = [];
const stored = {};
const downloads = [];
const fetches = [];

const persisted = {
  currentUser: JSON.stringify({
    data: {
      auth_token: "secret-test-token",
      current_school: { id: "school-1" }
    }
  })
};

const localValues = new Map([["persist:kinderlime", JSON.stringify(persisted)]]);

function storageGet(keys) {
  if (typeof keys === "string") return Promise.resolve({ [keys]: stored[keys] });
  if (Array.isArray(keys)) {
    return Promise.resolve(Object.fromEntries(keys.map((key) => [key, stored[key]])));
  }
  return Promise.resolve({ ...stored });
}

const context = vm.createContext({
  URL,
  URLSearchParams,
  console,
  globalThis: null,
  localStorage: {
    getItem(key) { return localValues.has(key) ? localValues.get(key) : null; },
    setItem(key, value) { localValues.set(key, String(value)); },
    removeItem(key) { localValues.delete(key); }
  },
  setTimeout,
  clearTimeout,
  chrome: {
    runtime: {
      onMessage: { addListener(listener) { listeners.push(listener); } },
      async sendMessage(message) {
        assert.equal(message.type, "DOWNLOAD_MEDIA");
        assert.equal(JSON.stringify(message).includes("secret-test-token"), false);
        downloads.push(message);
        return { ok: true, downloadId: downloads.length };
      }
    },
    storage: {
      local: {
        get: storageGet,
        async set(values) { Object.assign(stored, values); },
        async remove(keys) {
          for (const key of Array.isArray(keys) ? keys : [keys]) delete stored[key];
        }
      }
    }
  },
  async fetch(url, options) {
    fetches.push({ url, options });
    assert.equal(options.headers.Authorization, "Bearer secret-test-token");
    assert.equal(options.credentials, "omit");

    if (url.endsWith("/parent/kids/")) {
      return { ok: true, status: 200, json: async () => ({ kids: [{ id: 7, name: "Test Child" }] }) };
    }
    if (url.includes("daily_activities") && url.includes("page=1")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          daily_activities: [{
            id: 42,
            activity_type: "photo_activity",
            created_at: "2026-08-01T10:00:00Z",
            activiable: { id: 99, main_url: "https://media.example.test/full.jpg" }
          }]
        })
      };
    }
    return { ok: true, status: 200, json: async () => ({ daily_activities: [] }) };
  }
});
context.globalThis = context;

vm.runInContext(fs.readFileSync(path.join(extensionDir, "shared.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(extensionDir, "content.js"), "utf8"), context);

assert.equal(listeners.length, 1);
const listener = listeners[0];

function dispatch(message) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const result = listener(message, {}, (response) => {
      settled = true;
      resolve(response);
    });
    if (result !== true && !settled) reject(new Error(`No response for ${message.type}`));
  });
}

(async () => {
  const children = await dispatch({ type: "GET_CHILDREN" });
  assert.deepEqual(JSON.parse(JSON.stringify(children)), {
    ok: true,
    children: [{ id: "7", name: "Test Child" }]
  });

  const start = await dispatch({
    type: "START_DOWNLOAD",
    options: {
      childId: "7",
      startDate: "2026-08-01",
      endDate: "2026-08-10",
      includePhotos: true,
      includeVideos: true
    }
  });
  assert.equal(start.ok, true);

  const deadline = Date.now() + 3000;
  while ((!stored.runStatus || stored.runStatus.state === "running") && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  assert.equal(stored.runStatus.state, "complete");
  assert.deepEqual(JSON.parse(JSON.stringify(stored.runStatus.counts)), {
    found: 1,
    downloaded: 1,
    skipped: 0,
    failed: 0
  });
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].filename, "Procare Family Media/Test Child/2026-08/2026-08-01_99.jpg");
  assert.equal(JSON.stringify(stored).includes("secret-test-token"), false);
  assert.equal(fetches.length >= 4, true);

  console.log("content.js integration test passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
