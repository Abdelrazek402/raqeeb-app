# رَقِيب (Raqeeb)

Raqeeb is a real multi-platform focus and content-protection system. The web PWA provides the dashboard, prayer and remembrance features, while native clients enforce protection on the operating system.

## Architecture

- **Web PWA:** React, TypeScript, Vite, and the existing server API.
- **Android:** Kotlin application with an AccessibilityService, blocker activity, signed release APK, and authenticated PhoneLink foreground polling service.
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
```

### Android

Install `public/downloads/Raqeeb.apk`, open the app, then enable the Accessibility Service. Configure the PhoneLink server URL, device ID, and device token in the app preferences before starting synchronization.

### Windows

Download `Raqeeb-Setup.exe` from a GitHub Release and run it. It is a self-contained win-x64 application with the compiled Vite site embedded in the executable; on first launch it extracts the UI into the current user's local application data. It is not an MSI installer and does not install the WebView2 runtime.

The **Microsoft Edge WebView2 Evergreen Runtime** must be installed on Windows. If it is missing, install it from [Microsoft's WebView2 download page](https://developer.microsoft.com/microsoft-edge/webview2/) and relaunch Raqeeb. The app requests administrator elevation because editing the Windows hosts file requires it. It saves the first original hosts file as `hosts.raqeeb.bak`, applies the default blocklist at startup, and flushes DNS. Closing the window or minimizing it hides the window to the notification area while protection continues. Use the tray menu to reopen the dashboard or explicitly exit; exit removes only Raqeeb's managed hosts entries and leaves the backup available.

The frontend is built and copied into `windows-native/RaqeebProtector/wwwroot` by `npm run prepare:windows`; its ZIP is embedded as a resource during `dotnet publish`. The domain payload is generated from `DEFAULT_BLOCKED_DOMAINS` in `src/utils/blocklist.ts` and embedded separately. That export currently contains 484 entries (478 unique domains). The previous 529-line Windows payload also included the 51 `TRUSTED_SAFE_DOMAINS`, so those safe sites are intentionally excluded from hosts blocking.

For source installation, run `windows-native/Install-RaqeebProtector.ps1` from an elevated PowerShell prompt. It uses the checked-in generated domain list, creates the same backup, and flushes DNS.

### Browser extension

Install from the browser's extension manager using **Load unpacked** and select `extension/`, or install `public/downloads/Raqeeb-Extension.zip` from a release. The popup controls protection and displays the generated rule count.

### iOS

Open `ios/App/App.xcodeproj` on macOS in Xcode, select a signing team, and build for a simulator or device. Run `npm run build` and `npx cap sync ios` after web changes.

## CI/CD

`.github/workflows/release.yml` validates the web app, builds the signed Android release, publishes a self-contained Windows executable, packages the extension, and attaches all three artifacts to releases created from `v*.*.*` tags.
