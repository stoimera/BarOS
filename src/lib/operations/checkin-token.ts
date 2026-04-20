import { createHmac, randomBytes } from 'node:crypto'

export function generateCheckinTokenPlaintext(): string {
  return randomBytes(24).toString('base64url')
}

export function hashCheckinToken(plain: string): string {
  const pepper = process.env.EVENT_CHECKIN_PEPPER || 'dev-event-checkin-pepper'
  return createHmac('sha256', pepper).update(plain).digest('hex')
}
