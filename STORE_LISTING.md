# Chrome Web Store Submission Notes

## Listing

**Name:** Procare Media Downloader

**Summary:** Privately save Procare family photos and videos to your computer—without tracking, ads, or cloud uploads.

**Category:** Photos

**Visibility:** Private — trusted testers only

## Detailed description

Procare Media Downloader is a small community extension for parents who want a personal backup of the photos and videos already shared with their family through Procare.

Sign in to Procare normally, choose a child and date range, and start the download. Files are saved directly to your computer and organized by child and month.

Privacy features:

- no analytics, advertising, telemetry, developer server, or cloud storage;
- no password prompt;
- no remote executable code;
- no access to unrelated websites;
- no complete activity-data export; and
- local download history can be cleared at any time.

This independent community extension is not affiliated with or endorsed by Procare. Downloaded photos may include other children. Store and share them responsibly and follow your childcare centre's policies.

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
