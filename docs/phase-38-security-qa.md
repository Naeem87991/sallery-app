# Phase 38 security and destructive-action QA

## Security boundary

- Financial records stay in local browser storage; this application does not send them to an application server.
- The local app lock uses a randomly salted PBKDF2-SHA-256 verifier (210,000 iterations). Plaintext PINs are never persisted.
- Portable backups use fresh random AES-GCM IVs and salts, PBKDF2-SHA-256 key derivation, authenticated decryption, and strict schema/domain validation before any write.
- Security PIN data and passkey identifiers remain excluded from portable backups.

## Browser protections

- Every route sends a static-compatible Content Security Policy. It permits only same-origin scripts, data/blob local receipt images, same-origin worker and manifest files, and disallows objects, framing, and cross-origin form submission.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a restrictive `Permissions-Policy` add defense in depth.
- The service worker response is non-cacheable and is registered with `updateViaCache: 'none'`, protecting timely delivery of security updates.

## Destructive-action safeguards

- Deleting a ledger, career, security, or passkey record requires the existing confirmation flow. Removing the PIN additionally requires the current PIN.
- Backup restore requires successful decryption, schema validation, a reviewed item-count preview, an acknowledgement checkbox, and the exact typed word `REPLACE` before it can overwrite local records.
- Restore executes as one Dexie transaction, so an error leaves the existing records intact.

## Release checks

- Verify the response headers in a production deployment, including `/sw.js` cache policy.
- Exercise a wrong backup passphrase, corrupted backup, newer-schema backup, and each destructive confirmation path before release.
