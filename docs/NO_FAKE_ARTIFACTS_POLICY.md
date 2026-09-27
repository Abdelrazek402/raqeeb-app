# No fake artifacts policy

Raqeeb must never present generated placeholder data as a native installer or browser extension. A downloadable `.apk`, `.exe`, or extension archive must be the exact build output that passed the release workflow's platform-specific checks.

## Required behavior

- Native installer downloads must redirect to the corresponding asset attached to a GitHub Release. They must not synthesize, wrap, or fall back to a locally generated executable or package.
- If a real release asset is unavailable, do not substitute a debug build, a launcher, a fabricated archive, or a success-shaped response.
- The Android release must be signed and verified with `apksigner`; its application ID, version metadata, and minimum file size must be checked before upload.
- The Windows release must be a non-empty win-x64 PE executable and pass the release workflow's PE-header and embedded-resource checks.
- The extension archive must contain its declared Manifest V3 rule resources, valid unique rule IDs, and a reproducible SHA-256 value.
- Each release asset must have a matching `.sha256` sidecar generated from the exact file attached to the release.
- CI-only Android debug APKs are build checks, not user downloads or release assets.

## Implementation requirements

Download handlers must point only to `https://github.com/Abdelrazek402/raqeeb-app/releases/latest/download/<asset-name>`. Client code must not create executable/APK bytes or inject pairing credentials into installer files. There is no generated-artifact fallback.

When a build, signature, metadata, archive, or hash check fails, the release workflow must fail before publication. Never suppress verification errors or publish an asset whose provenance is unknown.

## Review checklist

For changes to artifact generation, packaging, or downloads, verify all of the following:

1. No synthetic native artifact builder or untrusted installer parameter remains in a production path.
2. Website links and API redirects resolve to the exact names attached to GitHub Releases.
3. The release workflow validates each artifact before publishing and attaches the matching checksums.
4. Missing or invalid build outputs stop publication; no placeholder is emitted.
5. Documentation describes what is actually tested and does not promise installation, protection, or Play Protect outcomes without runtime evidence.
