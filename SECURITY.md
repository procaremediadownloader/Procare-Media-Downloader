# Security Design

## Intended trust boundary

The extension runs only after a parent signs in directly to Procare and clicks the extension. It does not provide a separate login screen or operate a shared backend.

## Controls

- Manifest V3 with a content security policy that permits packaged scripts only.
- Exact Procare web/API host permissions rather than broad browsing access.
- HTTPS-only API and media URLs.
- Media download requests are accepted only from a Procare tab.
- File and folder names are sanitized twice before download.
- Authentication tokens are not placed in extension messages, logs, or extension storage.
- No source activity payloads are retained.
- Duplicate history contains identifiers and timestamps only.
- Downloads run sequentially and are recorded in local history only after Chrome reports completion.

## Release process

1. Review every source change.
2. Run all tests in the `tests` directory.
3. Search for newly introduced network destinations and dangerous APIs.
4. Test with a non-critical Procare account and inspect the Network panel.
5. Build a ZIP from only the `extension` directory.
6. Record its SHA-256 checksum.
7. Upload that exact ZIP to a restricted Chrome Web Store listing.

## Known risks

- Procare can change its private parent API at any time.
- Anyone able to publish a new extension version can alter what installed copies execute.
- Media URLs are supplied by Procare and may use third-party HTTPS storage providers.
- A parent may download an image containing other children and must protect it appropriately.
- Very large archives can be interrupted by closing the Procare tab, quitting Chrome, sleeping the computer, expired sessions, or insufficient disk space. Completed items remain resumable.

Use strong multifactor authentication on the Chrome Web Store publisher account and limit publishing access.
