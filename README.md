# رَقِيب (Raqeeb)

Raqeeb is a cross-platform focus and content-protection project. The web PWA provides the dashboard, prayer, and remembrance features; native clients contain operating-system integrations whose target-device behavior must be validated separately.

## Architecture

- **Web PWA:** React, TypeScript, Vite, and the existing server API.
- **Android:** Kotlin application source with an AccessibilityService, blocker activity, signed release APK, and a foreground PhoneLink poller. The legacy pairing-code-only REST API is disabled until owner-bound device enrollment is implemented.
- **Windows:** A self-contained .NET 8 WinForms desktop app renders the production Vite UI in Microsoft WebView2 and keeps hosts-based protection active from the system tray. It backs up and manages the Windows hosts file, flushes DNS, and can monitor the foreground window.
- **Browser extension:** Manifest V3 declarative blocking for 529 generated domains, SafeSearch enforcement, a local protection toggle, and reminder banner.
- **iOS:** Capacitor project under `ios/App`, generated from the PWA with `capacitor.config.ts`. Xcode builds require macOS.

## Installation

### Web

```powershell
npm ci
npm run dev
```

Production checks:

```powershell
npm run lint
npm run build
npm run test:firestore-rules
```

The Firestore rules test starts the local emulator and requires Java 21.

### Android

Download the `Raqeeb.apk` asset from the [latest GitHub Release](https://github.com/Abdelrazek402/raqeeb-app/releases/latest/download/Raqeeb.apk), install it, then review the Android permissions before enabling accessibility features. Native PhoneLink REST synchronization is currently unavailable and returns a structured `PHONE_LINK_AUTH_REQUIRED` error; a pairing code is not a device credential.

### Cloud pairing and PhoneLink

Browser-based Firestore sync requires signing in to the same Firebase account on each device. Pairing codes only locate the account-owned session; they do not grant access by themselves. Sessions expire after 30 days without renewal, and regenerating a code revokes the previous active session. Older sessions without an owner field must be recreated with a new pairing code. Separate Firebase accounts cannot join the same session.

#### Android release signing

Release APKs must be signed with the private release key. The key is never stored in this repository; `assembleRelease` fails if its signing configuration is missing. Debug builds continue to use Android's normal debug key.

Create the permanent upload key on a trusted computer outside the repository. The following PowerShell commands place it in your user profile; `keytool` prompts for the keystore and key passwords, so do not add password arguments:

```powershell
$keyDirectory = Join-Path $HOME ".raqeeb-signing"
New-Item -ItemType Directory -Force $keyDirectory | Out-Null
$keystore = Join-Path $keyDirectory "raqeeb-release.jks"
keytool -genkeypair -v -storetype JKS -keystore $keystore -alias raqeeb -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=Raqeeb, O=Raqeeb App, C=EG"
keytool -list -v -keystore $keystore -alias raqeeb
```

Confirm the listing reports alias `raqeeb` and owner `CN=Raqeeb, O=Raqeeb App, C=EG`. Record that alias and certificate DN separately from the key. Keep the keystore and passwords in a password manager, and retain an encrypted offline backup on a separate, secure medium; verify the backup can be read. Never commit, upload as a workflow artifact, or share the keystore or passwords.

Add these four repository **Actions secrets** under **Settings → Secrets and variables → Actions**: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD`. Set the alias secret to `raqeeb`; enter both passwords directly as secrets, not in command arguments or files. To base64-encode and send the keystore to GitHub without printing the private-key material in the terminal, authenticate `gh` for this repository and run:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes($keystore)) | gh secret set ANDROID_KEYSTORE_BASE64
```

The release workflow decodes the key into the runner's temporary directory, signs the release APK, requires verification with `apksigner`, checks its application ID and version metadata, and attaches it to GitHub Releases with a SHA-256 sidecar. Do not create or push a release tag until all four Actions secrets are configured. A newly created self-signed key can still trigger Play Protect warnings; signing alone does not guarantee those warnings disappear. Play App Signing or trusted distribution and established reputation may be needed.

### Windows

Download `Raqeeb-Setup.exe` from the [latest GitHub Release](https://github.com/Abdelrazek402/raqeeb-app/releases/latest/download/Raqeeb-Setup.exe) and run it. It is a self-contained win-x64 application with the compiled Vite site embedded in the executable; on first launch it extracts the UI into the current user's local application data. It is not an MSI installer and does not install the WebView2 runtime.

The **Microsoft Edge WebView2 Evergreen Runtime** must be installed on Windows. If it is missing, install it from [Microsoft's WebView2 download page](https://developer.microsoft.com/microsoft-edge/webview2/) and relaunch Raqeeb. The app requests administrator elevation because editing the Windows hosts file requires it. It saves the first original hosts file as `hosts.raqeeb.bak`, applies the default blocklist at startup, and flushes DNS. Closing the window or minimizing it hides the window to the notification area while protection continues. Use the tray menu to reopen the dashboard or explicitly exit; exit removes only Raqeeb's managed hosts entries and leaves the backup available.

The frontend is built and copied into `windows-native/RaqeebProtector/wwwroot` by `npm run prepare:windows`; its ZIP is embedded as a resource during `dotnet publish`. The domain payload is generated from `DEFAULT_BLOCKED_DOMAINS` in `src/utils/blocklist.ts` and embedded separately. That export currently contains 484 entries (478 unique domains). The previous 529-line Windows payload also included the 51 `TRUSTED_SAFE_DOMAINS`, so those safe sites are intentionally excluded from hosts blocking.

For source installation, run `windows-native/Install-RaqeebProtector.ps1` from an elevated PowerShell prompt. It uses the checked-in generated domain list, creates the same backup, and flushes DNS.

### Browser extension

Install from the browser's extension manager using **Load unpacked** and select `extension/`, or download [Raqeeb-Extension.zip](https://github.com/Abdelrazek402/raqeeb-app/releases/latest/download/Raqeeb-Extension.zip) from a GitHub Release. The popup controls protection and displays the generated rule count.

### iOS

Open `ios/App/App.xcodeproj` on macOS in Xcode, select a signing team, and build for a simulator or device. Run `npm run build` and `npx cap sync ios` after web changes.

## CI/CD

`.github/workflows/release.yml` validates the web app, builds the signed Android release, publishes a self-contained Windows executable, packages the extension, and attaches all three artifacts to releases created from `v*.*.*` tags.
