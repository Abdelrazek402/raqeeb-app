# Production feature implementation matrix

Statuses reflect tested evidence on this branch, not the presence of UI or source code:

- **REAL** — verified at the actual runtime boundary requested.
- **PARTIAL** — meaningful implementation or limited test evidence exists, but required behavior remains incomplete.
- **UNVERIFIED** — no reliable runtime evidence.
- **BROKEN** — known not to work or deliberately unavailable.

| Feature | Implementation and evidence | Remaining production evidence | Status |
|---|---|---|---|
| Synthetic APK/EXE generation | Server/client generators and startup pre-generation were removed; anti-fake tests pass. | None for generator removal. | REAL |
| Native download target | Routes redirect to fixed GitHub latest-release assets. Local HTTP redirects and the old release asset names were checked. | Download bytes and SHA-256 must be compared with a newly verified release. | PARTIAL |
| Android release signing | CI checks required secret names, builds release, verifies signer and APK metadata. Secret names are configured. | Release workflow has not run; signing input values were not read or tested. | UNVERIFIED |
| Android launcher icon | Density-specific launcher assets are generated from the original Raqeeb logo and referenced in Android resources; current `assembleDebug` succeeds. | Install on a device for launcher/task-switcher visual verification. | PARTIAL |
| Windows publish artifact | Self-contained `win-x64` publish succeeded locally; PE header, architecture, and 173,608,576-byte size were checked. | Windows runtime smoke test is unsafe on this host because startup requires administrator rights and immediately edits the hosts file. | PARTIAL |
| Windows app icon | Multi-resolution `.ico` from the original logo is referenced by the project and WinForms window/tray; the current executable's extracted 32×32 frame matches the source ICO pixel-for-pixel. | Visual check at actual Windows taskbar/tray sizes on an isolated target desktop. | PARTIAL |
| Unauthenticated web app shell | Production build served locally and rendered in installed Edge; sign-in actions appeared and the logo loaded in a real browser. | Authenticated Google OAuth and app workflows were not exercised. | PARTIAL |
| Android Accessibility blocking | The service reads real `AccessibilityEvent.packageName` values, compares them with a user-selected installed-app list persisted locally, requests `BlockerActivity` before any Home action, retries once when launch is not observed, and returns Home as a fallback if the blocker remains invisible. Notification is supplementary. The fixed eight-package starter set and static green/connected UI were removed. Android debug build succeeds. | The user reported the previous build showed only an alert on a real device. The revised launch path has not been re-tested because no authorized device is attached. The in-memory latest event is not a durable attempt history. | PARTIAL |
| Android UsageStats | `UsageStatsTracker` calls `UsageStatsManager.queryEvents` after Usage Access is granted and computes local foreground sessions from OS events; empty results are displayed as no events, not fabricated usage. | No device-side grant or measured-session comparison was performed. OS event reporting is asynchronous and may lag recent transitions; values remain local and are not synchronized to the web dashboard. | PARTIAL |
| PhoneLink enrollment and ACK | Android Google Sign-In creates a Firebase Auth identity, registers an Android device under that UID, listens to expiring owner-scoped Firestore commands, and records one immutable terminal ACK transition. The web client queues supported commands to Android device records. All 13 Firestore Emulator rules tests pass, and the rules have been deployed to `raqeeb-production`. | Physical-device Google Sign-In/command E2E is not run. This account-scoped design has no independently revocable device credential; any modified client authenticated as the owner can forge an ACK. | PARTIAL |
| Firestore pairing-session ownership | Rules require authenticated owner, active expiry, immutable owner and bounded renewal. Emulator tests cover owner and non-owner cases; production rules were deployed to `raqeeb-production` without required approval (see `HANDOFF.md`). | Live cross-account denial was not tested. Use separate authenticated accounts only after explicit approval for any production test. | PARTIAL |
| Windows process identity protection | Focus enforcement now checks the foreground process image path against a fixed browser executable-name allowlist before applying the existing title heuristic. This prevents unrelated windows with matching titles from being targeted. | Site classification remains title-based; basename matching does not authenticate publisher/signature, and runtime behavior has not been tested. Validate on an isolated Windows VM. | PARTIAL |
| Windows hosts protection | The app reads its embedded block list, backs up the hosts file once, edits only its marked section, flushes its temp-file write to disk, verifies persisted contents by reading back, and flushes DNS. A local self-contained x64 publish succeeds after excluding the unused WebView2 WPF reference; no MSB3277 warning remains. | No elevated Windows runtime, backup/restore, DNS or block verification test has run. Do not launch on this host because startup requires elevation and automatically edits the real hosts file; use a disposable VM. | PARTIAL |
| Browser extension rules | Rule count is derived from `rules.json`; package/archive validators pass for 529 boundary-safe rules. | Install in Chrome/Edge and verify actual dynamic rules and blocked requests. | PARTIAL |
| Browser extension icon/runtime | Archive structure is validated; Edge was used for web-app smoke testing, but the extension itself was not installed. | Verify extension installation, visible icon, permissions and blocking in supported browsers. | UNVERIFIED |
| Web analytics data honesty | Missing dates are excluded from aggregate denominators and charts, uncovered days are labeled, synthetic category inference/default chart values were removed. | No browser E2E for empty/history-gap/user-record scenarios; other screens still need a full audit. | PARTIAL |
| Whole-device usage dashboard | Android measurements are local and not synchronized; web timing only measures the visible/focused Raqeeb tab. | Authenticated usage sync and end-to-end validation across devices. | BROKEN |
| Push notification delivery | UI and server paths exist. | Delivery, device receipt, retries and acknowledgement semantics were not tested. | UNVERIFIED |
| AI online/local/fallback labeling | Companion UI and fallback sources exist. | Real network-offline and provider-error scenarios were not exercised. | UNVERIFIED |
| Release assets and checksums | CI definitions build APK/EXE/extension and generate SHA-256 sidecars. | Build/signing gates have not run end-to-end; no new release, tag, installed assets, or published checksums exist. | UNVERIFIED |

## Features implemented and verified by command output

Synthetic installer removal, existing web checks, all 13 Firestore Emulator rules tests, Android debug compilation, Android package metadata inspection, Windows x64 self-contained publish, and absence of the reproduced WebView2 `MSB3277` warning are verified only to those command boundaries. Firestore rule deployment occurred without authorization and is documented as an incident; emulator success is not a live cross-account test.

## Features implemented but requiring device/runtime verification

Android app selection/blocking, real notifications, UsageStats collection, Google Sign-In/PhoneLink delivery, Windows hosts blocking/restore/DNS, and focus enforcement are implemented to varying degrees but were not exercised on physical Android or isolated Windows devices. The Windows focus decision is executable-basename plus window-title matching, not publisher-verified process identity. See `HANDOFF.md` for exact test steps and constraints.

## Features unavailable or impossible to assert here

No Android device/emulator was attached, no safe elevated Windows VM was available, and no authenticated second Firebase end-user identity was available for a live access-denial test. Android usage is device-local and cannot populate the web dashboard in this implementation. The direct Firestore PhoneLink design cannot independently revoke a device or make ACKs trustworthy against a modified client authenticated as the owner.

## Validation evidence

`npm run lint`, `npm run build`, `npm run test:anti-fake`, `npm run test:extension`, and `npm run test:analytics-data` passed. Firestore Emulator rules tests passed 13/13. Android `assembleDebug` passed with the user-selected installed-app blocker UI and actual-event notification code; package ID/version metadata was inspected, but no Android device is attached. Windows self-contained `win-x64` publish succeeded with no MSB3277 after excluding the unused WebView2 WPF reference. The Windows app was deliberately not launched because startup requires administrator rights and automatically edits the hosts file. There was no live cross-account Firebase test, Android E2E, Windows elevated-runtime test, or official release/tag.

See [`E2E_TEST_REPORT.md`](E2E_TEST_REPORT.md), [`RELEASE_INTEGRITY_REPORT.md`](RELEASE_INTEGRITY_REPORT.md), [`SECURITY_TEST_REPORT.md`](SECURITY_TEST_REPORT.md), and [`PRODUCTION_REALITY_REPORT.md`](PRODUCTION_REALITY_REPORT.md) for detailed limits and evidence.
