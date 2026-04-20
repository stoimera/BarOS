/**
 * Data Encryption Utilities for PII (Personally Identifiable Information)
 *
 * Implements AES-256-GCM encryption for sensitive data fields
 * Note: For production, consider using a dedicated key management service (KMS)
 */

import crypto from 'crypto'
import { createLogger } from '@/lib/logger'

const encryptionLog = createLogger('security.encryption')

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits
const ITERATIONS = 100000 // PBKDF2 iterations
/** v2 JSON envelope, base64url-encoded after this prefix. Legacy v1 is `ivHex:tagHex:cipherHex`. */
const V2_PREFIX = 'v2:'

type V2Envelope = {
  v: 2
  alg: typeof ALGORITHM
  iv: string
  tag: string
  d: string
}

/**
 * Get encryption key from environment variable
 * In production, use a proper key management service
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for encryption')
  }

  // If key is hex-encoded, decode it; otherwise use it directly
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }

  // Use deterministic salt so encrypted values are decryptable across restarts.
  const salt = process.env.ENCRYPTION_KEY_SALT ?? 'urban-bar-crm:encryption:v1'
  return crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha512')
}

/**
 * Encrypt sensitive data (v2 envelope; includes version and algorithm id).
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    const envelope: V2Envelope = {
      v: 2,
      alg: ALGORITHM,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      d: encrypted,
    }

    return `${V2_PREFIX}${Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url')}`
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    encryptionLog.error('encrypt_failed', { errorMessage: err.message })
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data (v2 envelope or legacy v1 `iv:tag:ciphertext` hex).
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()

    if (encryptedData.startsWith(V2_PREFIX)) {
      const json = Buffer.from(encryptedData.slice(V2_PREFIX.length), 'base64url').toString('utf8')
      const envelope = JSON.parse(json) as Partial<V2Envelope>
      if (
        envelope.v !== 2 ||
        envelope.alg !== ALGORITHM ||
        !envelope.iv ||
        !envelope.tag ||
        !envelope.d
      ) {
        throw new Error('Invalid v2 encrypted envelope')
      }

      const iv = Buffer.from(envelope.iv, 'hex')
      const tag = Buffer.from(envelope.tag, 'hex')

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(envelope.d, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    }

    const parts = encryptedData.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    encryptionLog.error('decrypt_failed', { errorMessage: err.message })
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypt email address
 */
export function encryptEmail(email: string): string {
  if (!email) return ''
  return encrypt(email.toLowerCase().trim())
}

/**
 * Decrypt email address
 */
export function decryptEmail(encryptedEmail: string): string {
  if (!encryptedEmail) return ''
  try {
    return decrypt(encryptedEmail)
  } catch {
    return encryptedEmail // Return as-is if decryption fails (might be plaintext)
  }
}

/**
 * Encrypt phone number
 */
export function encryptPhone(phone: string): string {
  if (!phone) return ''
  return encrypt(phone)
}

/**
 * Decrypt phone number
 */
export function decryptPhone(encryptedPhone: string): string {
  if (!encryptedPhone) return ''
  try {
    return decrypt(encryptedPhone)
  } catch {
    return encryptedPhone // Return as-is if decryption fails
  }
}

/**
 * Hash sensitive data (one-way, for searching)
 * Use this for fields that need to be searchable but not readable
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Generate a searchable hash for email (for lookup without decryption)
 */
export function hashEmail(email: string): string {
  if (!email) return ''
  return hashData(email.toLowerCase().trim())
}

/**
 * Re-wrap ciphertext in the current envelope (v2). Decrypts legacy v1 or v2, then encrypts as v2.
 */
export function migrateCipherToLatestEnvelope(ciphertext: string): string {
  return encrypt(decrypt(ciphertext))
}
