# Private Chrome Web Store Submission

Step-by-step for publishing this as a **private** listing that only named
testers can install. `STORE_LISTING.md` holds the copy to paste into each field;
this file is the running order.

## Before you open the console

- [ ] Bump `version` in `extension/manifest.json` if 0.3.1 was already uploaded.
- [ ] Run `tools/package.sh` and note which ZIP it built.
- [x] Privacy-policy URL — **live**:
      `https://procaremediadownloader.github.io/Procare-Media-Downloader/privacy.html`
- [x] Homepage URL — **live**:
      `https://procaremediadownloader.github.io/Procare-Media-Downloader/`
- [ ] Have the tester email list ready (the Google account each parent signs into
      Chrome with — not necessarily the address Procare has on file).
- [ ] Decide the support email shown publicly on the listing.

## One-time account setup

Skip this if you already have a developer account.

1. Go to https://chrome.google.com/webstore/devconsole and sign in with the
   Google account that should **own** this extension long-term. Whoever holds
   this account can push code to every installed copy, so use an account with
   strong two-factor authentication.
2. Pay the one-time **$5 USD** developer registration fee. Registration is not
   complete until this clears.
3. Fill in the publisher contact email and verify it. Google will not review a
   submission with an unverified contact address.

## Upload and configure

4. **Add new item** → upload the ZIP from `dist/`. Do not upload a hand-made
   archive and do not upload the whole project folder — only `extension/` is
   packaged, which `tools/package.sh` handles.
5. **Store listing** tab — paste the name, summary, description, and category
   from `STORE_LISTING.md`. Upload both PNGs from `store-assets/`.
6. **Privacy** tab:
   - Single-purpose description → the one line in `STORE_LISTING.md`.
   - A justification for each of `activeTab`, `downloads`, `storage`, and both
     Procare host permissions. All five are written out in `STORE_LISTING.md`;
     a missing one is the most common rejection.
   - Data-use disclosures → follow the "Privacy questionnaire guidance" section.
     Tick authentication information, website content, and personally
     identifiable information as *handled*, and certify that none of it is sold,
     transferred for unrelated purposes, or used for creditworthiness.
   - Paste the privacy-policy URL.
7. **Distribution** tab:
   - Visibility → **Private**.
   - Add every tester's Google account email. **Anyone not on this list cannot
     install the extension**, even with the direct link.
   - Leave "Available in all regions" alone; it does not widen a private listing.
8. Submit for review. Private listings are still reviewed. Expect anywhere from
   a few hours to a couple of weeks, and expect at least one round of questions
   about the host permissions.

## After approval

9. Install it yourself first from the private link and run one real download
    before sending the link to anyone else.
10. Send parents the private store link plus the group message template at the
    bottom of `SHARING.md`.
11. Record the approved version and its SHA-256 from `dist/SHA256SUMS` in
    `NOTES.md` so there is a record of exactly what parents received.

## Hosting the privacy policy

The URL must open for a reviewer who is not signed in to anything. A link that
requires a login will fail review.

**Done.** GitHub Pages is enabled on `main` / root and both pages are live and
verified reachable without any login:

- Policy: `https://procaremediadownloader.github.io/Procare-Media-Downloader/privacy.html`
- Homepage: `https://procaremediadownloader.github.io/Procare-Media-Downloader/`

If either ever 404s, check **Settings → Pages** is still pointed at `main` /
`/ (root)`, and confirm in a private browsing window — that is exactly what a
reviewer sees.

`privacy.html` and `index.html` at the repo root are the published pages, and
`.nojekyll` makes Pages serve them as static files with no build step.
`PRIVACY.md` remains the source of truth — **any edit there must be mirrored into
`privacy.html`**, which is what reviewers and parents actually read.

## Notes on the alternatives

Do **not** plan on distributing the raw ZIP or a `.crx` to parents. Chrome on
Windows and macOS blocks ordinary off-store installs, and the unpacked
Developer-mode route means every parent must keep Developer mode on and re-load
the folder by hand. `SHARING.md` covers this. The private store listing is the
only route that gives parents a normal one-click install.
