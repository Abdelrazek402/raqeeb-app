# Release integrity report

| Asset | Build source | Required checks in this branch | Result |
|---|---|---|---|
| `Raqeeb.apk` | Android Gradle `assembleRelease` output | `apksigner verify --verbose --print-certs`; Android application ID `com.raqeeb.app`; version `1.0.0` / code `1`; size above 100,000 bytes | PARTIAL — no signed release APK or workflow run was available here. Signing secret names exist, but the newly required `ANDROID_GOOGLE_SERVICES_JSON_BASE64` Actions secret is not configured; Android CI/release workflows will stop until it is added. Secret values were not read. |
| `Raqeeb-Setup.exe` | .NET 8 self-contained `win-x64` publish output | DOS and PE signatures; AMD64 machine type; minimum 5 MiB; WebView site and blocklist resources staged before publish; associated icon resource check | PARTIAL — local x64 publish succeeded at 173,608,576 bytes; PE machine is AMD64 and the publish log contains no `MSB3277`. The workflow was not run, the executable is not Authenticode-signed, and no Windows runtime test was run. |
| `Raqeeb-Extension.zip` | `extension/` packaged by `scripts/package-extension.js` | Manifest V3; manifest-declared rule resources present; non-empty rules with unique positive IDs; generated ZIP can be reopened and contents checked | PARTIAL — local packaging/validation succeeded reproducibly (529 rules; SHA-256 `2455addf222bd5d1015a1f574546ae78065448b5a404e3e99901bce91d7977d0`); no browser runtime or published release was tested. |

The release job copies the extension archive to the release asset root, calculates SHA-256 sidecars for all three exact release files, verifies those sidecars with `sha256sum --check`, and attaches the assets and sidecars. The source workflow was not executed. No tag was created, no release was published, and no binary or signing material was committed.

The app's Windows and Android download routes return HTTP 302 to:

- `https://github.com/Abdelrazek402/raqeeb-app/releases/latest/download/Raqeeb-Setup.exe`
- `https://github.com/Abdelrazek402/raqeeb-app/releases/latest/download/Raqeeb.apk`

The browser extension is documented at:

- `https://github.com/Abdelrazek402/raqeeb-app/releases/latest/download/Raqeeb-Extension.zip`

GitHub's latest release was queried during this change and reported `v1.0.8` with all three matching native/extension asset names. That existing release has no `.sha256` sidecars; no release was edited or republished.

**Status:** PARTIAL. Workflow definitions are not release evidence. A release is not integrity-verified until the CI jobs pass and the downloaded asset hashes match the attached sidecars.
