import crypto from 'crypto'
import { decrypt, encrypt, migrateCipherToLatestEnvelope } from '@/lib/security/encryption'

const KEY_HEX = Buffer.alloc(32, 9).toString('hex')

function legacyV1Encrypt(plaintext: string): string {
  const key = Buffer.from(KEY_HEX, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

describe('encryption envelope', () => {
  const prev = process.env.ENCRYPTION_KEY

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = KEY_HEX
  })

  afterAll(() => {
    process.env.ENCRYPTION_KEY = prev
  })

  it('encrypts as v2 and round-trips', () => {
    const c = encrypt('hello-track1')
    expect(c.startsWith('v2:')).toBe(true)
    expect(decrypt(c)).toBe('hello-track1')
  })

  it('decrypts legacy v1 triple-hex format', () => {
    const v1 = legacyV1Encrypt('legacy-plain')
    expect(v1.split(':')).toHaveLength(3)
    expect(decrypt(v1)).toBe('legacy-plain')
  })

  it('migrateCipherToLatestEnvelope upgrades v1 to v2', () => {
    const v1 = legacyV1Encrypt('upgrade-me')
    const v2 = migrateCipherToLatestEnvelope(v1)
    expect(v2.startsWith('v2:')).toBe(true)
    expect(decrypt(v2)).toBe('upgrade-me')
  })
})
