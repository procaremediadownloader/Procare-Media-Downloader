"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

require("../extension/shared.js");

let messageListener;
const changeListeners = new Set();
const downloadCalls = [];

const context = vm.createContext({
  URL,
  ProcareSafe: globalThis.ProcareSafe,
  clearTimeout,
  console,
  importScripts() {},
  setTimeout,
  chrome: {
    runtime: {
      lastError: null,
      onMessage: { addListener(listener) { messageListener = listener; } }
    },
    downloads: {
      download(options, callback) {
        downloadCalls.push(options);
        callback(55);
      },
      search(_query, callback) { callback([{ id: 55, state: "in_progress" }]); },
      onChanged: {
        addListener(listener) { changeListeners.add(listener); },
        removeListener(listener) { changeListeners.delete(listener); }
      }
    }
  }
});

vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "extension", "background.js"), "utf8"),
  context
);

assert.equal(typeof messageListener, "function");

(async () => {
  const responsePromise = new Promise((resolve) => {
    const keepAlive = messageListener(
      {
        type: "DOWNLOAD_MEDIA",
        url: "https://media.example.test/photo.jpg",
        filename: "Procare Family Media/Test/2026-08/photo.jpg"
      },
      { tab: { url: "https://schools.procareconnect.com/dashboard" } },
      resolve
    );
    assert.equal(keepAlive, true);
  });

  assert.equal(downloadCalls.length, 1);
  assert.equal(changeListeners.size, 1);
  for (const listener of [...changeListeners]) {
    listener({ id: 55, state: { current: "complete" } });
  }
  assert.deepEqual(JSON.parse(JSON.stringify(await responsePromise)), { ok: true, downloadId: 55 });
  assert.equal(changeListeners.size, 0);

  const rejected = await new Promise((resolve) => {
    messageListener(
      { type: "DOWNLOAD_MEDIA", url: "https://media.example.test/photo.jpg", filename: "photo.jpg" },
      { tab: { url: "https://evil.example/" } },
      resolve
    );
  });
  assert.equal(rejected.ok, false);
  assert.equal(downloadCalls.length, 1);

  console.log("background.js integration test passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
