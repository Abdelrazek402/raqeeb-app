# PhoneLink with Firebase Auth and Firestore

## Data model

PhoneLink uses the signed-in Firebase Auth UID as the owner boundary:

- `users/{uid}/phonelinkDevices/{deviceId}` stores an Android installation record. The installation ID is a random UUID held in app-private preferences; it is an identifier, not a credential.
- `users/{uid}/phonelinkDevices/{deviceId}/commands/{commandId}` stores an expiring command with immutable owner/device/command identity, action, payload, `pending` status, creation time, expiry, and creator UID.
- A command may transition once from `pending` to `acknowledged` or `failed`. The update writes a server timestamp and a short client result. A second transition and post-expiry ACK are denied.

Commands currently supported by the Android listener are `ring`, `stop_ring`, `toggle_focus_shield`, and `send_clipboard`. New command records expire after two minutes; Firestore rules reject any command whose expiry is not in the future or exceeds five minutes.

## Android configuration

The Android app uses Google Sign-In to obtain an ID token and exchanges it with Firebase Auth. The Google Services Gradle plugin reads the ignored local file `android/app/google-services.json`; it must contain the Android app `com.raqeeb.app`, the matching Firebase project, and a Web OAuth client ID. The same Google account then resolves to the same Firebase UID used by the web app.

CI must receive the same Firebase Android app configuration as the repository secret `ANDROID_GOOGLE_SERVICES_JSON_BASE64`. The JSON is intentionally not committed. At the time of this change, GitHub Actions did not have that secret configured, so the Android CI/release workflows will stop at their explicit configuration check until it is added. Android release signing uses its separate keystore secrets; neither configuration is generated or substituted with placeholder data.

## Security boundary and service requirements

This design uses Firebase Auth and Firestore directly and does not require Cloud Functions or a Blaze-only backend. Rules isolate data between Firebase UIDs, validate fields, bound command expiry, and prevent repeated ACK transitions.

This is **not device-level authentication**. There is no independently revocable per-device credential. Any client authenticated as the account owner can read and write that owner's PhoneLink records, including registering devices and creating commands. A modified client with that account can forge an ACK. An `acknowledged` status means only that the client reports accepting the command for local handling; it is not proof that the operating system carried out the action. No server-side component verifies command execution.

The old `/api/phonelink/*` server routes remain disabled with structured HTTP 503 responses. Emulator tests establish rule behavior only; physical Android Google Sign-In, notifications/foreground-service behavior, command delivery, and production deployment are separate verification steps.
