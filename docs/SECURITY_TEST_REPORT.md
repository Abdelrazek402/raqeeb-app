# Security test report

**Method:** source review by the security-review agent followed by Firestore Emulator rules tests. No live exploit, deployed-rules check, or device test was run. Findings below are code-level; confidence is the reviewer's estimate.

| # | Severity | File | Lines | Finding | Confidence |
|---|---|---|---|---|---|
| 1 | HIGH | `firestore.rules` | 65-77 | Before this branch, pairing-session reads/writes were not owner-bound and guessed non-existent IDs were readable. The rules now require authenticated ownership, active expiry, and owner-only revocation; emulator tests exercise the boundary. | 9/10 |
| 2 | HIGH | `server.ts` | 422-428 | Before this branch, PhoneLink state and command routes authorized by pairing code alone. The branch now retires those routes with structured HTTP 503 until owner-bound device enrollment exists. | 9/10 |
| 3 | HIGH | `server/installerBuilder.ts` (deleted) | 9-12, 133 | The previous installer generator embedded a shell command containing a request-derived URL after removing only quote characters; forwarded host/protocol values could inject shell metacharacters. | 8/10 |

The legacy pairing-code-only PhoneLink REST access remains disabled with structured HTTP 503 responses. A direct Firebase Auth + Firestore path now stores Android device records and expiring commands below the authenticated owner's UID. Rules validate the device/command schema, keep ownership and command identity immutable, allow only a single pending-to-terminal ACK transition, reject expired ACKs, and deny cross-account access. Emulator coverage is expanded beyond the earlier five pairing-session tests.

**Explicit trust limits:** there is no per-device credential that can be independently revoked. Every client authenticated as the owner can read/write its own owner-scoped records, so a modified client can forge an ACK or register another device. `acknowledged` means only that the client reported accepting the command for local handling; it is not server-verified physical execution. The implementation intentionally uses no Cloud Functions or Blaze-only service.

**Test status:** All 13 Firestore Emulator tests passed after the PhoneLink rule additions. The rules were deployed to `raqeeb-production`; Android device authorization/runtime remains UNVERIFIED. Do not treat pairing-code secrecy or the shared Firebase account as a per-device authorization boundary.

**Dependency audit:** `npm audit --omit=dev` reports zero production dependency vulnerabilities. The full audit reports five moderate advisories in the Firebase CLI's development-only transitive dependency tree; the pinned CLI is used only for emulator tests and is not shipped in the application.
