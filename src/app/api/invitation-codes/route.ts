import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.invitation-codes')

const createInvitationCodeSchema = z.object({
  role: z.enum(['admin', 'staff', 'customer']),
  expiresIn: z.coerce.number().int().positive(),
  maxUses: z.coerce.number().int().positive(),
})

const updateInvitationCodeSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
})

export const GET = withSecurity(
  async () => {
    try {
      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Invitation Codes API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      const supabase = await createClient()
      const { data, error } = await supabase
        .from('invitation_codes')
        .select(
          `
        *,
        created_by_user:profiles!invitation_codes_created_by_fkey(first_name, last_name, email),
        used_by_user:profiles!invitation_codes_used_by_fkey(first_name, last_name, email)
      `
        )
        .order('created_at', { ascending: false })

      if (error) {
        log.error('Invitation Codes API: Failed to fetch invitation codes:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ data })
    } catch (error) {
      log.error('Invitation Codes API: Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'user',
  }
)

export const POST = withSecurity(
  async (_request, { user, validatedBody }) => {
    try {
      const { role, expiresIn, maxUses } = validatedBody as z.infer<
        typeof createInvitationCodeSchema
      >

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Invitation Codes API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      const supabase = await createClient()

      // Get the user's profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }

      // Generate a unique code
      const generateUniqueCode = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      const code = generateUniqueCode()

      // Calculate expiration date
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresIn)

      // Create invitation code in database
      const { data: invitation, error } = await supabase
        .from('invitation_codes')
        .insert([
          {
            code,
            role,
            created_by: profile.id,
            expires_at: expiresAt.toISOString(),
            is_active: true,
            max_uses: maxUses,
          },
        ])
        .select()
        .single()

      if (error) {
        log.error('Invitation Codes API: Failed to create invitation code:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data: invitation })
    } catch (error: unknown) {
      log.error('Invitation Codes API: Error creating invitation code:', error)
      const message = error instanceof Error ? error.message : 'Failed to create invitation code'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: createInvitationCodeSchema,
    auditAction: 'create',
    auditResourceType: 'user',
  }
)

export const PATCH = withSecurity(
  async (_request, { validatedBody }) => {
    try {
      const { id, is_active } = validatedBody as z.infer<typeof updateInvitationCodeSchema>

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Invitation Codes API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      const supabase = await createClient()

      const { error } = await supabase.from('invitation_codes').update({ is_active }).eq('id', id)

      if (error) {
        log.error('Invitation Codes API: Failed to update invitation code:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } catch (error: unknown) {
      log.error('Invitation Codes API: Error updating invitation code:', error)
      const message = error instanceof Error ? error.message : 'Failed to update invitation code'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: updateInvitationCodeSchema,
    auditAction: 'update',
    auditResourceType: 'user',
  }
)

export const DELETE = withSecurity(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
      }

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Invitation Codes API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      const supabase = await createClient()

      // Delete the invitation code
      const { error } = await supabase.from('invitation_codes').delete().eq('id', id)

      if (error) {
        log.error('Invitation Codes API: Failed to delete invitation code:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } catch (error: unknown) {
      log.error('Invitation Codes API: Error deleting invitation code:', error)
      const message = error instanceof Error ? error.message : 'Failed to delete invitation code'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'user',
  }
)
