# Development

Chrome extension (Manifest V3) that saves the photos and videos already visible
to a signed-in Procare parent account onto that parent's own computer. Built to
be handed to a small group of parents through a **private** Chrome Web Store
listing, not a public release.

## Layout

| Path | What it is |
| --- | --- |
| `extension/` | The exact folder that gets zipped and uploaded. Nothing else ships. |
| `tests/` | Plain `node` scripts, no framework. Run all three. |
| `tools/package.sh` | Builds `dist/<name>-<version>.zip`. The only sanctioned way to make an upload. |
| `store-assets/` | 1280x800 store screenshots plus the HTML that generates them and `render.sh`. |
| `dist/` | Every ZIP ever uploaded, plus `SHA256SUMS`. Provenance — don't prune. |
| `PRIVACY.md` `SECURITY.md` | The promises this project makes. Treat as binding. |
| `SHARING.md` `STORE_LISTING.md` `SUBMISSION.md` | Distribution and Web Store paperwork. |

## Hard rules

These are not style preferences. Parents install this on their own machines and
the media involved is photos of other people's children.

1. **No new hosts.** Network access stays limited to
   `schools.procareconnect.com` and `api-school.procareconnect.com`. No CDN, no
   analytics, no error reporting, no fonts, no developer server. `package.sh`
   warns on any other host it finds in the bundle — never silence that warning,
   fix the code.
2. **No remote code.** Manifest V3 CSP is `script-src 'self'`. No `eval`, no
   injected `<script src>`, no fetched-then-executed anything.
3. **The session token never leaves the tab.** It is read for HTTPS calls to
   Procare and must never land in `chrome.storage`, extension messages, logs, or
   a download filename.
4. **Local storage stays minimal** — media identifiers and completion
   timestamps only, so downloads can resume. Never cache activity payloads.
5. **New permission = new paperwork.** Any addition to `permissions` or
   `host_permissions` needs a matching justification in `STORE_LISTING.md` and,
   if it changes data handling, an update to `PRIVACY.md` before release.
6. **Never commit real family data** — no child names, photos, tokens, activity
   JSON, tester email addresses, or account screenshots. Store screenshots use
   "Sample Child". This repository is public; treat every commit accordingly.

## Releasing

Version lives only in `extension/manifest.json`. The Web Store rejects a
re-upload of an existing version, so bump it first, then:

```sh
tools/package.sh          # runs tests, builds dist ZIP, appends SHA256SUMS
```

`SUBMISSION.md` has the console steps. Keep listing visibility **Private** with
an explicit tester list; a public listing was never the goal.

## Testing

```sh
node tests/shared.test.js
node tests/content.integration.test.js
node tests/background.integration.test.js
```

`package.sh` runs all three and refuses to build if any fail. There is no live
Procare fixture — anything touching the real API has to be checked by hand in a
signed-in tab with the Network panel open, per `SECURITY.md`.

After a real run, audit what actually landed on disk:

```sh
tools/check-downloads.py            # defaults to ~/Downloads/Procare Family Media
```

It flags the failure the unit tests cannot see: `scoreMediaCandidate` in
`shared.js` picks a media URL by scoring key names, so a payload shape it does not
expect yields **thumbnails downloaded as if they were originals**, with every
count reporting success. The script also reports folder layout, zero-byte files,
duplicate contents (which would mean the skip-already-saved history is broken),
and Chrome `uniquify` suffixes indicating filename collisions.

## Screenshots

`store-assets/render.sh` re-renders both 1280x800 PNGs through headless Chrome.
The HTML carries a **copy** of `popup.css`, so a visible UI change means editing
those files to match before re-rendering. Chrome writes the PNG and then
lingers instead of exiting; the script waits on the files, which is deliberate.
