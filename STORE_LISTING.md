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

### `activeTab`

Used when the user opens the extension to confirm that the active tab is Procare and communicate with that tab. It does not provide ongoing access to unrelated tabs.

### `downloads`

Required to save the Procare media selected by the user into organized folders within Chrome's Downloads location.

### `storage`

Stores media identifiers and timestamps locally so the extension can avoid duplicate downloads, plus the current progress state. It never stores the Procare authentication token or full activity responses.

### `https://schools.procareconnect.com/*`

Required to run the user interface integration only on Procare's family website and use the session created when the user signs in directly to Procare.

### `https://api-school.procareconnect.com/*`

Required to request the list of authorized children and media activity records needed for the download feature.

## Privacy questionnaire guidance

Disclose that the extension handles authentication information, website content, and personally identifiable information locally to provide its single purpose. State clearly that none of this data is collected by or transmitted to the developer, sold, used for advertising, or used for creditworthiness.

The public privacy-policy URL should contain the exact policy in `PRIVACY.md`. A private repository URL is unsuitable because users and reviewers must be able to open the policy without repository access.

## Assets still needed before submission

- At least one accurate store screenshot after live Procare testing.
- A publicly accessible, stable copy of the privacy policy.
- Support/contact email monitored by the publisher.
- Final tester email list.

Do not submit screenshots containing real child names, faces, identifiers, balances, messages, or other family data. Use a deliberately redacted or staged account view.
