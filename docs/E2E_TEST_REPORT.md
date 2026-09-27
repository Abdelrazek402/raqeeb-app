# End-to-end test report

**Execution result:** native-device and production-release end-to-end tests were **NOT TESTED** in this environment. Source changes and successful compilation alone do not establish installation, runtime enforcement, synchronization, or delivery.

| Scenario | Status | Evidence / limitation |
|---|---|---|
| Web TypeScript/build and source validators | PARTIAL | Latest `npm run lint`, `npm run build`, `npm run test:anti-fake`, `npm run test:extension`, and `npm run test:analytics-data` passed. These validate source/build/package structure only, not target runtime behavior. |
| Android app compilation | PARTIAL | Current `android/gradlew.bat assembleDebug --no-daemon` completed successfully with Java 17 and Android API 34, including the latest icon and UsageStats resources. This is a debug APK build, not a signed release or device test. |
| Unauthenticated web app in a real browser | PARTIAL | Served the production Vite build locally and opened it in installed Microsoft Edge headless via DevTools Protocol. HTTP returned 200; the unauthenticated sign-in screen rendered, its two actions were present, and the logo image loaded at 1024 px source width. No browser console errors were observed. OAuth, account login, and authenticated workflows were not exercised. |
| Windows download returns the published release executable | UNVERIFIED | Local HTTP request returned a 302 to the named asset, and GitHub reports that asset on the latest release; no binary download or hash comparison was performed. |
| Windows self-contained publish artifact | PARTIAL | Installed .NET SDK 8.0.425 and successfully published locally. The executable is a 91,507,445-byte x64 PE; its extracted 32×32 icon matches the source ICO frame pixel-for-pixel. Publish emitted unresolved `MSB3277` WindowsBase version-conflict warnings. It was not launched: the manifest requires administrator rights and startup immediately edits the hosts file. |
| Windows runtime, hosts backup/restore, and focus enforcement | UNVERIFIED | Needs an isolated Windows VM/snapshot. Launching on this development host would modify its real hosts file. Source now checks the foreground executable name against a browser allowlist before applying the title heuristic, but identity detection and enforcement were not runtime-tested. |
| Windows Authenticode signature | UNVERIFIED | No code-signing certificate/signing step is configured or applied by the current release workflow. The local publish is unsigned. |
| Android download returns the published release APK | UNVERIFIED | Local HTTP request returned a 302 to the named asset, and GitHub reports that asset on the latest release; no binary download or hash comparison was performed. |
| Android install, AccessibilityService, blocker, and UsageStats behavior | UNVERIFIED | No Android device or emulator run was performed. |
| Android PhoneLink authentication, command acknowledgements, expiry, and replay handling | UNVERIFIED | No paired-device E2E run was performed. |
| Windows startup, WebView2 dashboard, process monitoring, hosts changes, restore, and DNS flush | UNVERIFIED | No Windows target runtime or elevated-hosts test was performed. |
| Browser extension install and blocking behavior | UNVERIFIED | Edge is available, but the extension was not installed and no DNR runtime test was performed. |
| Firestore owner isolation across accounts | PARTIAL | Firestore Emulator tests pass 5/5 covering owner/non-owner read, write, and delete; unauthenticated reads; expiry; and revocation. Production rules deployment and real account/device E2E were not tested. |
| Push notification delivery and acknowledgement semantics | UNVERIFIED | No browser/device subscription delivery test was performed. |
| Legacy PhoneLink REST paths | PARTIAL | Local HTTP requests to state, commands, and sync paths returned structured HTTP 503; no authenticated native replacement flow is implemented or tested. |

No UI-only state, generated file, or workflow definition is counted as runtime proof. CI checks must pass in the release workflow, and the device/browser scenarios above still require execution on their target platforms.
