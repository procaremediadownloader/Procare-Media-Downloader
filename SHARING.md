# Sharing With the Parent Group

## Recommended: private Chrome Web Store listing

This gives parents a normal **Add to Chrome** installation without Developer mode.

1. Register a dedicated Chrome Web Store developer account and enable strong multifactor authentication.
2. Upload the versioned ZIP from `dist/`.
3. Set visibility to **Private** and restrict it to trusted tester accounts.
4. Add each parent's Google-account email address.
5. Complete the store listing, single-purpose statement, permission justifications, and privacy disclosures.
6. Link to the hosted copy of `PRIVACY.md` as the privacy policy.
7. Submit for review.
8. After approval, send the private store link to the group.

Suggested single-purpose statement:

> Save photos and videos already available to the user's signed-in Procare family account directly to the user's computer.

Suggested permission explanations:

- `activeTab`: confirms and communicates with the Procare tab selected by the user.
- `downloads`: saves authorized photos and videos to the user's Downloads folder.
- `storage`: remembers local download identifiers to avoid duplicates and shows progress.
- Procare host access: reads the user's authorized family media from Procare when the user starts a download.

## Direct ZIP sharing

You may post the ZIP in a private group for testing, but Windows and macOS Chrome do not provide a normal one-click installation for extensions outside the Chrome Web Store. Each tester must unzip it, enable Developer mode at `chrome://extensions`, choose **Load unpacked**, and select the extension folder.

Do not tell parents to drag a `.crx` file into Chrome; Chrome blocks ordinary off-store CRX installation on Windows and macOS.

## Group message template

> This community extension downloads only the Procare photos and videos already visible to your signed-in account. Files go directly to your computer. The extension has no analytics, advertisements, cloud service, or access to unrelated websites. Please protect downloaded photos and do not repost images of other children without permission.
