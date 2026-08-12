"use strict";

const assert = require("node:assert/strict");
require("../extension/shared.js");

const safe = globalThis.ProcareSafe;

assert.equal(safe.sanitizeSegment('A/B: C*?'), "A B C");
assert.equal(safe.dateOnly("2026-08-10T12:34:56Z"), "2026-08-10");
assert.equal(safe.extensionFor("https://cdn.example/photo.JPG?token=abc", "photo"), "jpg");
assert.equal(safe.extensionFor("https://cdn.example/video", "video"), "mp4");
assert.equal(safe.validateMediaUrl("https://cdn.example/photo.jpg"), true);
assert.equal(safe.validateMediaUrl("http://cdn.example/photo.jpg"), false);
assert.equal(safe.validateMediaUrl("https://127.0.0.1/photo.jpg"), false);
assert.equal(safe.findBestMediaUrl({
  thumbnail_url: "https://cdn.example/thumb.jpg",
  main_url: "https://cdn.example/medium.jpg",
  original_url: "https://cdn.example/original.jpg"
}, "photo"), "https://cdn.example/original.jpg");
assert.equal(safe.findBestMediaUrl({
  main_url: "https://cdn.example/poster.jpg",
  video_file_url: "https://cdn.example/movie.mp4"
}, "video"), "https://cdn.example/movie.mp4");
assert.equal(safe.findBestMediaUrl({
  main_url: "https://cdn.example/photo.jpg",
  profile_image_url: "https://cdn.example/profile-original.jpg"
}, "photo"), "https://cdn.example/photo.jpg");
assert.deepEqual(safe.monthWindows("2026-06-15", "2026-08-10"), [
  { from: "2026-08-01", to: "2026-08-10" },
  { from: "2026-07-01", to: "2026-07-31" },
  { from: "2026-06-15", to: "2026-06-30" }
]);

const activity = {
  id: 12,
  activity_type: "photo_activity",
  created_at: "2026-07-02T10:00:00Z",
  activiable: { id: 99, main_url: "https://cdn.example/photo.jpg" }
};
const media = safe.extractMedia(activity);
assert.deepEqual(media, {
  kind: "photo",
  url: "https://cdn.example/photo.jpg",
  id: "99",
  date: "2026-07-02"
});
assert.equal(safe.filenameFor("Sam / Test", media), "Procare Family Media/Sam Test/2026-07/2026-07-02_99.jpg");
assert.equal(safe.historyKey("kid-1", activity, media), "kid-1:12:99");

console.log("shared.js tests passed");
