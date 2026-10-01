# Production end-to-end test plan

**Execution status:** The target-device, production-account, and release flows below have not been executed. A successful build or emulator rules test is not E2E evidence.

## Flow A — Android protection

**Prerequisites:** Android device on a supported API level; signed APK; clean app install.

1. Install the release APK and record its SHA-256 before installation.
2. Grant Usage Access, overlay access only if used by the tested blocker UI, and Accessibility access using system settings.
3. Confirm the native screen reports the granted state and usage appears as measured only after querying UsageStatsManager.
4. Open a package configured in the monitored package list.
5. Verify a real accessibility event identifies its package and the blocker activity appears.
6. Return to Home, dismiss the blocker, relaunch the monitored app, reboot, and repeat.
7. Revoke the permissions and verify the UI reports protection as unavailable rather than active.

**Evidence to retain:** device/API/build identifiers, permission state, package name, event/session timestamps, screen recording, reboot outcome, and APK hash. Never record unrelated app content.

## Flow B — Windows hosts protection

**Prerequisites:** signed or verified self-contained win-x64 release, disposable Windows VM, elevated test account, DNS/network access.

1. Record SHA-256 and PE machine metadata, then install/run the published binary on a clean VM.
2. Verify WebView2 startup, tray icon, startup behavior, and protection state.
3. Record the hosts file and backup hash before enabling protection.
4. Enable protection; verify only the delimited Raqeeb section changes, the file is flushed, and DNS flush succeeds.
5. Resolve and request a blocked test domain to verify blocking at runtime.
6. Disable protection; verify only Raqeeb's section is removed and the domain resolves/reaches the expected test endpoint again.
7. Restart with protection enabled and disabled, test recovery after an invalid/missing resource, and exit cleanly.

**Safety:** use a disposable VM and controlled test domains; do not modify a production workstation's DNS/hosts configuration during acceptance.

## Flow C — Android ↔ PhoneLink

**Current implementation:** Android signs in through Google Sign-In and Firebase Auth, then registers under `/users/{uid}/phonelinkDevices/{deviceId}`. The web client creates short-lived command documents in that device's `commands` subcollection. The Android foreground service listens for pending commands and attempts a single terminal ACK transition.

1. Install the debug/release APK on a physical Android device and sign in with the same Google account used by the web app.
2. Verify the Android device document appears under the signed-in UID and that an account B cannot read it or its commands.
3. From the web client for account A, send ring, stop-ring, focus, and clipboard commands; verify each command is created with a unique ID, pending status, and expiry no more than five minutes away.
4. Verify Android handles each supported command and writes a terminal `acknowledged` or `failed` status before expiry. Confirm a second ACK update is rejected.
5. Wait for expiry and verify the service ignores the command; verify malformed command fields, cross-account access, and owner changes are denied by emulator tests.
6. Sign out and confirm the foreground service stops; sign back in and verify the same installation device ID is reused.

**Security boundary:** Firestore ownership is by Firebase UID, not by an independently authenticated device. Deleting/revoking a device credential is not supported because no per-device credential exists. A modified client signed into the owner's account can create commands and forge ACKs; ACK is a client report that local handling was accepted, not independently verified execution. No server-side enforcement or Cloud Functions are used.

**Evidence to retain:** redacted device/command IDs and lifecycle timestamps only. Do not log OAuth tokens or Firebase credentials.

## Flow D — dashboard and real usage

**Prerequisites:** two authenticated same-owner accounts/devices only where the product supports that model, Android Usage Access granted, enrolled native devices, and a clean user with no prior history.

1. Log in and verify device owner, device ID, last-seen time, and connection freshness against backend records.
2. Generate known foreground app sessions on Android; compare OS usage events and daily aggregate against displayed package/time totals.
3. Confirm web/Windows values are labeled by their real measurement source and are not inferred from Android data.
4. Check an empty profile and dates without history: those must say “Not measured”/“No data,” not measured zero.
5. Create prayer, focus, and reminder records and verify their date/user ownership and export output.
6. Repeat as owner B; owner A's devices, telemetry, and history must not be readable or mutable.

## Flow E — release integrity

**Prerequisites:** all required Android signing secrets, production build access, Windows runner, GitHub release-write permission, and target install devices.

1. Run lint, web build, Firestore security tests, anti-fake checks, extension tests, Android build, and Windows publish.
2. Verify APK signer, package ID/version, Windows x64 PE/resource metadata, extension manifest/rule count, and all artifact hashes.
3. Publish the approved new version/tag only after all platform gates pass.
4. Download each exact GitHub Release asset and sidecar; verify each SHA-256 independently.
5. Verify website download redirects target the exact release asset URL and compare downloaded bytes/hashes.
6. Install APK/EXE/extension in target environments and run the smoke checks in Flows A–D.

**Current result:** NOT RUN. No tag or release was created from this session. Signing credentials and target device/browser acceptance were unavailable.
