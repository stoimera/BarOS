import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'

export const GET = withSecurity(
  async () => {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
    if (!key) {
      return NextResponse.json({ error: 'Push is not configured' }, { status: 503 })
    }
    return NextResponse.json({ publicKey: key })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'user',
  }
)
