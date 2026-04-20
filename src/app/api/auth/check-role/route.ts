import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withSecurity } from '@/lib/security/api-middleware'
import { createLogger } from '@/lib/logger'

const log = createLogger('api.auth.check-role')

export const GET = withSecurity(
  async (_req, { user }) => {
    try {
      const cookieStore = await cookies()

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )

      log.info('check_role_start', { userId: user.id })

      // Get the user's current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        log.error('check_role_profile_error', {
          userId: user.id,
          code: profileError.code,
          message: profileError.message,
        })
        return NextResponse.json(
          {
            error: 'Profile not found',
            user: user.id,
            profile: null,
            role: null,
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        user: user.id,
        profile: profile,
        role: profile.role,
        message: `User has role: ${profile.role}`,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      log.error('check_role_unexpected', { userId: user.id, errorMessage: err.message })
      return NextResponse.json({ error: 'Failed to check role' }, { status: 500 })
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
