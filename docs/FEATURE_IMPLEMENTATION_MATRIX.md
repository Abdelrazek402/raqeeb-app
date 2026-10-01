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
| Windows publish artifact | Self-contained `win-x64` publish succeeded locally; PE header, architecture, and 91,507,445-byte size were checked. | Windows runtime smoke test is unsafe on this host because startup requires administrator rights and immediately edits the hosts file. | PARTIAL |
| Windows app icon | Multi-resolution `.ico` from the original logo is referenced by the project and WinForms window/tray; the current executable's extracted 32×32 frame matches the source ICO pixel-for-pixel. | Visual check at actual Windows taskbar/tray sizes on an isolated target desktop. | PARTIAL |
| Unauthenticated web app shell | Production build served locally and rendered in installed Edge; sign-in actions appeared and the logo loaded in a real browser. | Authenticated Google OAuth and app workflows were not exercised. | PARTIAL |
| Android Accessibility blocking | Native service and UI source exist. | No real Android device/emulator test verified permission, target app detection, or blocking. | UNVERIFIED |
| Android UsageStats | UsageStatsManager tracker reads real foreground events when the user grants Usage Access; data remains device-local. | Rebuild after icon changes, grant permission on a device, validate measured package totals, and sync to dashboard. | PARTIAL |
| PhoneLink enrollment and ACK | Android Google Sign-In creates a Firebase Auth identity, registers an Android device under that UID, listens to expiring owner-scoped Firestore commands, and records one immutable terminal ACK transition. The web client queues supported commands to Android device records. All 13 Firestore Emulator rules tests pass, and the rules have been deployed to `raqeeb-production`. | Physical-device Google Sign-In/command E2E is not run. This account-scoped design has no independently revocable device credential; any modified client authenticated as the owner can forge an ACK. | PARTIAL |
| Firestore pairing-session ownership | Rules require authenticated owner, active expiry, immutable owner and bounded renewal. Emulator tests cover owner and non-owner cases. | Deploy rules and validate with real Firebase accounts/devices. | PARTIAL |
| Windows process identity protection | Focus enforcement now checks the foreground process image path against a fixed browser executable-name allowlist before applying the existing title heuristic. This prevents unrelated windows with matching titles from being targeted. | Site classification remains title-based; basename matching does not authenticate publisher/signature, and runtime behavior has not been tested. Validate on an isolated Windows VM. | PARTIAL |
| Windows hosts protection | Hosts manager and DNS flush source exist. | No elevated Windows runtime, backup/restore, or verification test has run. Must not be launched on this host because it requires administrator rights and automatically edits hosts. | UNVERIFIED |
| Browser extension rules | Rule count is derived from `rules.json`; package/archive validators pass for 529 boundary-safe rules. | Install in Chrome/Edge and verify actual dynamic rules and blocked requests. | PARTIAL |
| Browser extension icon/runtime | Archive structure is validated; Edge was used for web-app smoke testing, but the extension itself was not installed. | Verify extension installation, visible icon, permissions and blocking in supported browsers. | UNVERIFIED |
| Web analytics data honesty | Missing dates are excluded from aggregate denominators and charts, uncovered days are labeled, synthetic category inference/default chart values were removed. | No browser E2E for empty/history-gap/user-record scenarios; other screens still need a full audit. | PARTIAL |
| Whole-device usage dashboard | Android measurements are local and not synchronized; web timing only measures the visible/focused Raqeeb tab. | Authenticated usage sync and end-to-end validation across devices. | BROKEN |
| Push notification delivery | UI and server paths exist. | Delivery, device receipt, retries and acknowledgement semantics were not tested. | UNVERIFIED |
| AI online/local/fallback labeling | Companion UI and fallback sources exist. | Real network-offline and provider-error scenarios were not exercised. | UNVERIFIED |
| Release assets and checksums | CI definitions build APK/EXE/extension and generate SHA-256 sidecars. | Build/signing gates have not run end-to-end; no new release, tag, installed assets, or published checksums exist. | UNVERIFIED |

## Validation evidence

`npm run lint`, `npm run build`, `npm run test:anti-fake`, `npm run test:extension`, and `npm run test:analytics-data` passed on this branch. The production web build was also served and its unauthenticated screen/logo rendered in installed Edge; authenticated OAuth and workflows were not exercised. The web build emitted a large-chunk warning. Firestore Emulator rules tests passed 5/5. The current Android `assembleDebug` build passed with the latest icon and tracker resources. .NET SDK 8.0.425 was installed in the user profile; self-contained Windows publish plus local PE/icon checks passed. Publish emitted unresolved `MSB3277` WindowsBase version-conflict warnings from the WebView2 WPF reference; investigate before treating the Windows build as release-clean. Focus enforcement now checks the foreground executable name against a browser allowlist before applying the existing title heuristic; no runtime identity or enforcement test was run. The app was deliberately not launched because startup requires administrator rights and immediately edits the hosts file. No Android device is attached. No official release or tag was created.

See [`E2E_TEST_REPORT.md`](E2E_TEST_REPORT.md), [`RELEASE_INTEGRITY_REPORT.md`](RELEASE_INTEGRITY_REPORT.md), [`SECURITY_TEST_REPORT.md`](SECURITY_TEST_REPORT.md), and [`PRODUCTION_REALITY_REPORT.md`](PRODUCTION_REALITY_REPORT.md) for detailed limits and evidence.
