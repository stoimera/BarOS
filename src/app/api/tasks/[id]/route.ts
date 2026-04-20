import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.tasks.[id]')

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  due_date: z.string().optional(),
  time: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  related_event_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const GET = withSecurity(
  async (_req, { user, routeContext }) => {
    try {
      const { params } = routeContext as { params: Promise<{ id: string }> }
      const { id } = await params

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

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      if (!['staff', 'admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Get the task
      const { data: task, error } = await supabase.from('tasks').select('*').eq('id', id).single()

      if (error) {
        log.error('Error fetching task:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
      }

      return NextResponse.json({ task })
    } catch (error) {
      log.error('Task API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'task',
  }
)

export const PUT = withSecurity(
  async (_req, { user, routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: Promise<{ id: string }> }
      const { id } = await params
      const taskData = validatedBody as z.infer<typeof updateTaskSchema>

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

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      if (!['staff', 'admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Update the task
      const { data: task, error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        log.error('Error updating task:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
      }

      return NextResponse.json({ task })
    } catch (error) {
      log.error('Task API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: updateTaskSchema,
    auditAction: 'update',
    auditResourceType: 'task',
  }
)

export const DELETE = withSecurity(
  async (_req, { user, routeContext }) => {
    try {
      const { params } = routeContext as { params: Promise<{ id: string }> }
      const { id } = await params

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

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      if (!['staff', 'admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Delete the task
      const { error } = await supabase.from('tasks').delete().eq('id', id)

      if (error) {
        log.error('Error deleting task:', error)
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      log.error('Task API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'task',
  }
)
