# Encryption envelope (Track 1.12)

Implementation: `src/lib/security/encryption.ts`. Tests: `src/__tests__/security/encryption.test.ts`.

## v2 (current write format)

- Prefix: `v2:` then base64url JSON envelope `{ v, alg, iv, tag, d }`.
- Algorithm: `aes-256-gcm`.
- Key material: `ENCRYPTION_KEY` (64-char hex or string passed through PBKDF2 with optional `ENCRYPTION_KEY_SALT`).

## v1 (legacy read)

- Legacy ciphertext shape: colon-separated hex triple `ivHex:tagHex:cipherHex`.
- Decrypt path tries v2 first, then v1.

## Operations

- **Encrypt**: always produces v2.
- **Decrypt**: supports v2 and v1.
- **Migrate**: `migrateCipherToLatestEnvelope` upgrades stored v1 strings to v2 where applicable.

Do not log plaintext, keys, or full ciphertext in application logs.
