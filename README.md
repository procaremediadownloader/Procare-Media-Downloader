# Procare Media Downloader

A small, privacy-first Chrome extension for saving photos and videos already available to a parent's signed-in Procare account.

## Safety model

- No developer server, analytics, telemetry, advertisements, or license checks.
- No remote executable code.
- No password prompt and no exported Procare authentication token.
- No complete daily-activity JSON export.
- Media is downloaded directly from URLs supplied by Procare to the parent's computer.
- When Procare supplies multiple media sizes, the extension prefers original, full, large, or download sources and avoids thumbnails and previews.
- Download history remains in Chrome extension storage and can be cleared by the user.
- The extension runs only on `schools.procareconnect.com` and calls only Procare's school API.

This is an independent community project. It is not affiliated with or endorsed by Procare.

## Test locally

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `extension` folder in this project.
5. Sign in at `https://schools.procareconnect.com/`.
6. Select the extension from Chrome's Extensions menu.

Local unpacked installation is intended for trusted testing. For parent distribution, use a private Chrome Web Store listing restricted to trusted testers.

## Project layout

- `extension/` — the exact folder uploaded to the Chrome Web Store.
- `tests/` — local static/unit tests.
- `PRIVACY.md` — plain-language privacy policy.
- `SECURITY.md` — security design and reporting guidance.
- `SHARING.md` — direct-sharing and private-store instructions.
- `STORE_LISTING.md` — prepared store copy, permission justifications, and submission checklist.
- `dist/` — versioned ZIP packages and checksums, built by `tools/package.sh`.
- `store-assets/` — 1280x800 Chrome Web Store screenshots and the script that renders them.
- `SUBMISSION.md` — ordered checklist for the private Chrome Web Store listing.

## Test

```sh
node tests/shared.test.js
node tests/content.integration.test.js
node tests/background.integration.test.js
```

## Current limitations

- Chrome desktop only.
- Uses Procare's existing parent web API, which may change without notice.
- Downloads are queued through Chrome and may require permission for multiple downloads.
- Large archives run sequentially and may take hours. The Procare tab must remain open and the computer must stay awake.
- The first release intentionally omits captions and full activity metadata.
