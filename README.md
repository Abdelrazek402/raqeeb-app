# رَقِيب (Raqeeb)

Raqeeb is a real multi-platform focus and content-protection system. The web PWA provides the dashboard, prayer and remembrance features, while native clients enforce protection on the operating system.

## Architecture

- **Web PWA:** React, TypeScript, Vite, and the existing server API.
- **Android:** Kotlin application with an AccessibilityService, blocker activity, signed release APK, and authenticated PhoneLink foreground polling service.
- **Windows:** C# .NET Win32 tray protector. It backs up and manages the Windows hosts file, flushes DNS, and can monitor the foreground window. `Install-RaqeebProtector.ps1` is available when the .NET SDK is not installed locally.
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

For a published executable, download `Raqeeb-Setup.exe` from a GitHub Release and run it as administrator. For source installation, run `windows-native/Install-RaqeebProtector.ps1` from an elevated PowerShell prompt. The installer creates a `.raqeeb.bak` hosts backup and flushes DNS.

### Browser extension

Install from the browser's extension manager using **Load unpacked** and select `extension/`, or install `public/downloads/Raqeeb-Extension.zip` from a release. The popup controls protection and displays the generated rule count.

### iOS

Open `ios/App/App.xcodeproj` on macOS in Xcode, select a signing team, and build for a simulator or device. Run `npm run build` and `npx cap sync ios` after web changes.

## CI/CD

`.github/workflows/release.yml` validates the web app, builds the signed Android release, publishes a self-contained Windows executable, packages the extension, and attaches all three artifacts to releases created from `v*.*.*` tags.
