# Security test report

**Method:** source review by the security-review agent followed by Firestore Emulator rules tests. No live exploit, deployed-rules check, or device test was run. Findings below are code-level; confidence is the reviewer's estimate.

| # | Severity | File | Lines | Finding | Confidence |
|---|---|---|---|---|---|
| 1 | HIGH | `firestore.rules` | 65-77 | Before this branch, pairing-session reads/writes were not owner-bound and guessed non-existent IDs were readable. The rules now require authenticated ownership, active expiry, and owner-only revocation; emulator tests exercise the boundary. | 9/10 |
| 2 | HIGH | `server.ts` | 422-428 | Before this branch, PhoneLink state and command routes authorized by pairing code alone. The branch now retires those routes with structured HTTP 503 until owner-bound device enrollment exists. | 9/10 |
| 3 | HIGH | `server/installerBuilder.ts` (deleted) | 9-12, 133 | The previous installer generator embedded a shell command containing a request-derived URL after removing only quote characters; forwarded host/protocol values could inject shell metacharacters. | 8/10 |

All three reported vulnerabilities are mitigated in this branch: Firestore sessions are owner-bound and emulator-tested; pairing-code-only PhoneLink REST access is disabled rather than returning protected state; and the generated executable path is removed. The unavailable REST API is not replaced with a secure native flow, so this is a security mitigation, not evidence that native synchronization works.

**Test status:** All five Firestore rules tests passed in the emulator. Production rule deployment and Android/Windows device authorization remain UNVERIFIED. Do not treat pairing-code secrecy as an authorization boundary.

**Dependency audit:** `npm audit --omit=dev` reports zero production dependency vulnerabilities. The full audit reports five moderate advisories in the Firebase CLI's development-only transitive dependency tree; the pinned CLI is used only for emulator tests and is not shipped in the application.
