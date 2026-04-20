import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { migrateCipherToLatestEnvelope } from '@/lib/security/encryption'

const bodySchema = z.object({
  ciphertexts: z.array(z.string().min(1)).min(1).max(100),
  dryRun: z.boolean().optional(),
})

type ReencryptBody = z.infer<typeof bodySchema>

export const POST = withSecurity<ReencryptBody>(
  async (_req, { validatedBody }) => {
    const body = validatedBody!
    if (body.dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        items: body.ciphertexts.map((c) => ({
          alreadyV2: c.startsWith('v2:'),
        })),
      })
    }

    const migrated = body.ciphertexts.map((c) => migrateCipherToLatestEnvelope(c))
    return NextResponse.json({ ok: true, migrated })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    validateBody: bodySchema,
    auditAction: 'update',
    auditResourceType: 'organization',
  }
)
