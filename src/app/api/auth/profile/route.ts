import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.auth.profile')

const PROFILE_UPDATABLE_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'avatar_url',
  'birthday',
  'tags',
  'notes',
  'preferences',
  'is_active',
] as const

function pickProfileUpdatePayload(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  for (const key of PROFILE_UPDATABLE_FIELDS) {
    if (key in body) {
      out[key] = body[key]
    }
  }
  return out
}

const updateProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
  birthday: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
})

export const GET = withSecurity(
  async (_request, { user }) => {
    try {
      log.info('User authenticated:', user.id)

      // Use service role client for profile operations (bypasses RLS)
      const serviceRoleClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return []
            },
            setAll() {
              // No-op for server-side usage
            },
          },
        }
      )

      // Get the user's profile using service role client
      const { data: profile, error: profileError } = await serviceRoleClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        log.error('Profile error:', profileError)

        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          log.info('Profile not found, creating new profile for user:', user.id)

          const nameParts: string[] = []
          const newProfile = {
            user_id: user.id,
            email: '',
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            role: user.role || 'admin', // Default to admin for dashboard access
            is_active: true,
          }

          log.info('Creating profile with data:', newProfile)

          const { data: createdProfile, error: createError } = await serviceRoleClient
            .from('profiles')
            .insert([newProfile])
            .select()
            .single()

          if (createError) {
            log.error('Failed to create profile:', createError)
            return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
          }

          log.info('Profile created successfully:', createdProfile)
          return NextResponse.json(createdProfile)
        }

        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      log.info('Profile loaded successfully:', profile)
      return NextResponse.json(profile)
    } catch (error) {
      log.error('Profile API error:', error)
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'customer',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'user',
  }
)

export const PUT = withSecurity(
  async (_request, { user, validatedBody }) => {
    try {
      const body = validatedBody as Record<string, unknown>
      log.info('profile_put_start', { userId: user.id, fields: Object.keys(body ?? {}) })

      // Use service role client for profile operations (bypasses RLS)
      const serviceRoleClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return []
            },
            setAll() {
              // No-op for server-side usage
            },
          },
        }
      )

      const updates = pickProfileUpdatePayload(body)

      // Update the user's profile
      const { data: updatedProfile, error: updateError } = await serviceRoleClient
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        log.error('Profile update error:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      log.info('Profile updated successfully:', updatedProfile)
      return NextResponse.json(updatedProfile)
    } catch (error) {
      log.error('Profile update API error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'customer',
    rateLimitType: 'strict',
    validateBody: updateProfileSchema,
    auditAction: 'update',
    auditResourceType: 'user',
  }
)
