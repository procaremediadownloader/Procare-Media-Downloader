# Chrome Web Store Submission Notes

## Listing

**Name:** Procare Media Downloader

**Summary:** Privately save Procare family photos and videos to your computer—without tracking, ads, or cloud uploads.

**Category:** Photos

**Visibility:** Private — trusted testers only

## Detailed description

Paste verbatim into the console's description field (3,786 of 16,000 characters).

```text
Procare Media Downloader saves the photos and videos already shared with your family through Procare directly to your own computer.

If your childcare centre posts daily photos, those pictures live inside Procare's app. Saving a year of them by hand means opening each one and downloading it individually. This extension does that for you, in bulk, without sending anything anywhere.

HOW IT WORKS

1. Sign in to Procare the way you always do, at schools.procareconnect.com.
2. Click the extension and pick a child and a date range.
3. Choose photos, videos, or both, and start the download.

Files are saved to your normal Downloads folder, sorted into folders by child and by month, so a long archive stays organized instead of dumping thousands of files into one place.

BUILT FOR LONG ARCHIVES

Downloads run one file at a time so Procare is never hammered with requests. Every completed file is remembered locally, which means:

- You can stop at any time and pick up later.
- Re-running the same date range skips everything already saved instead of downloading it twice.
- If your connection drops or you close the tab, nothing is lost. Start it again and it continues.

A multi-year archive can take a while. Keep the Procare tab open and your computer awake while it runs.

WHAT IT DOES NOT DO

This extension has no business model, so there is nothing pulling it toward collecting your data:

- No analytics, telemetry, tracking, or advertising of any kind.
- No developer server and no cloud storage. Your photos travel from Procare to your computer and nowhere else.
- No password prompt. It uses the session you created by signing in to Procare yourself, and never sees or stores your credentials.
- No access to any website other than Procare.
- No remote code. Everything it runs is inside the package Google reviewed.
- No export of your full activity history, messages, or billing information. It reads only what it needs to find photo and video files.

The only thing stored on your machine is a list of which files you have already downloaded, so it can skip them next time. You can clear that at any time from the extension.

A COMMITMENT, NOT JUST A CURRENT STATE

No future version of this extension will introduce data collection, tracking, or data sharing. If Procare ever changes its service so that this tool cannot work without collecting or transmitting data, the project will be shut down rather than changed to allow it. The extension will also not be sold or transferred to another publisher, since a new owner could ship an update that breaks those promises.

The complete source code is published so anyone can check these claims rather than take them on trust:
https://github.com/procaremediadownloader/Procare-Media-Downloader

Full privacy policy:
https://procaremediadownloader.github.io/Procare-Media-Downloader/privacy.html

PLEASE BE THOUGHTFUL WITH WHAT YOU SAVE

Photos shared by a childcare centre often include children other than your own. Please store them carefully and think twice before reposting images of other people's children. Your centre may have its own guidance on sharing media as well.

REQUIREMENTS AND LIMITS

- Chrome on desktop, with a Procare parent account you already use.
- It relies on Procare's existing parent website, which can change without notice. If Procare changes how their site works, downloads may stop until the extension is updated.
- Chrome may ask permission the first time a batch of downloads begins.

NOT AFFILIATED WITH PROCARE

This is an independent project by a parent, for parents. It is not affiliated with, endorsed by, or sponsored by Procare Software or its affiliates. "Procare" is used only to describe the service the extension works with.

Questions: freeprocaremediadownloader@gmail.com
```

## Single purpose

Save photos and videos already available to the user's signed-in Procare family account directly to the user's computer.

## Permission justifications

Paste each verbatim into its own box in the console's Privacy tab. The console
presents **one combined box for both host permissions**, not one per host.
Character counts are against the 1,000-character limit per box.

### `activeTab` — 661/1000

```text
The extension acts only on the tab the user is already viewing, and only after they click the toolbar icon. When the popup opens it confirms the active tab is the Procare family website, then exchanges messages with the content script in that tab to list the children on the account and to start or cancel a download the user asked for. activeTab is what allows the popup to identify and communicate with that single user-selected tab. It grants no ongoing access to other tabs, no browsing history, and no access at all before the user clicks. activeTab was chosen instead of the broader "tabs" permission specifically to keep this scope as narrow as possible.
```

### `downloads` — 798/1000

```text
Saving files to the user's own computer is the entire purpose of this extension, and chrome.downloads is the only API that can do it. For each photo or video the user requested, chrome.downloads.download writes the file to a relative path such as "Procare Family Media/<child>/2026-03/2026-03-14_12345.jpg" inside the user's normal Downloads folder, so a large archive stays organised by child and month.

chrome.downloads.onChanged and chrome.downloads.search are used to detect whether each file completed or was interrupted. That completion signal is what makes the queue sequential and resumable: only files Chrome confirms as complete are recorded, so re-running a date range skips them instead of creating duplicates. No download is ever started without the user pressing the download button.
```

### `storage` — 791/1000

```text
chrome.storage.local holds two small pieces of data, both required for the single purpose.

First, a list of identifiers for media already downloaded, each with a completion timestamp, so re-running a date range skips files the user already has rather than downloading them twice. This is essential because a multi-year archive is typically downloaded across several sessions.

Second, the current progress state — counts of saved, skipped and failed files plus a status message — so the popup can display progress and recover if it is closed and reopened mid-run.

The Procare session token is never written to storage. No daily-activity responses, media files, names, or captions are cached. The user can erase everything stored with the "Clear local download history" button in the popup.
```

### Host permissions (combined box) — 931/1000

```text
Two Procare hosts are requested and both are required for the single purpose.

https://schools.procareconnect.com/* is where the content script runs. This is the site the parent signs in to directly, and the extension reuses the session that already exists in that tab rather than asking for credentials. It is also the only origin from which the service worker will accept a download request.

https://api-school.procareconnect.com/* is Procare's own parent API. The extension makes exactly two kinds of authenticated GET request: /parent/kids/ to list the children on the account so the user can choose one, and /parent/daily_activities/ over the chosen date range to locate the photo and video files that account is already permitted to see.

No other host is requested. Media files are retrieved by chrome.downloads from the HTTPS URLs Procare returns, which requires no host permission, and no data is sent to any third party.
```

### Remote code

Select **"No, I am not using Remote code."** If a justification box still appears:

```text
All executable code ships inside the package: popup.js, content.js, shared.js and background.js. There are no external script tags, no remotely hosted modules, no eval and no new Function. The manifest sets content_security_policy.extension_pages to "script-src 'self'; object-src 'none'", so the browser itself blocks loading any script from outside the package.
```

## Privacy questionnaire guidance

Disclose that the extension handles authentication information, website content, and personally identifiable information locally to provide its single purpose. State clearly that none of this data is collected by or transmitted to the developer, sold, used for advertising, or used for creditworthiness.

The public privacy-policy URL should contain the exact policy in `PRIVACY.md`. A private repository URL is unsuitable because users and reviewers must be able to open the policy without repository access.

## Assets still needed before submission

- At least one accurate store screenshot after live Procare testing.
- A publicly accessible, stable copy of the privacy policy.
- Support/contact email monitored by the publisher.
- Final tester email list.

Do not submit screenshots containing real child names, faces, identifiers, balances, messages, or other family data. Use a deliberately redacted or staged account view.
