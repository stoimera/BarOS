import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.tasks')

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  due_date: z.string().min(1),
  time: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  related_event_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const GET = withSecurity(
  async (req, { user }) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get('status')
      const priority = searchParams.get('priority')
      const category = searchParams.get('category')
      const assigned_to = searchParams.get('assigned_to')
      const due_date = searchParams.get('due_date')
      const search = searchParams.get('search')

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

      // Build query
      let query = supabase.from('tasks').select('*')

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      if (priority && priority !== 'all') {
        query = query.eq('priority', priority)
      }
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }
      if (assigned_to) {
        query = query.eq('assigned_to', assigned_to)
      }
      if (due_date) {
        query = query.eq('due_date', due_date)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data: tasks, error } = await query.order('due_date', { ascending: true })

      if (error) {
        log.error('Error fetching tasks:', error)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
      }

      return NextResponse.json({ tasks: tasks || [] })
    } catch (error) {
      log.error('Tasks API error:', error)
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

export const POST = withSecurity(
  async (_req, { user, validatedBody }) => {
    try {
      const taskData = validatedBody as z.infer<typeof createTaskSchema>

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
              } catch {}
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

      // Find current staff id for visibility under RLS (tasks SELECT policy allows viewing assigned tasks)
      let currentStaffId: string | null = null
      const { data: staffRow } = await supabase
        .from('staff')
        .select('id')
        .eq('profile_id', profile.id)
        .single()
      currentStaffId = staffRow?.id ?? null

      // Clean and prepare task data with only the fields that definitely exist
      const assignedToValue: string | null =
        taskData.assigned_to &&
        typeof taskData.assigned_to === 'string' &&
        taskData.assigned_to.trim() !== ''
          ? taskData.assigned_to
          : currentStaffId // default to creator's staff id so they can see the task immediately under RLS

      const taskToInsert = {
        title: taskData.title as string,
        description: taskData.description || null,
        due_date: taskData.due_date as string,
        time: taskData.time || null,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'general',
        tags: Array.isArray(taskData.tags) ? taskData.tags : [],
        related_event_id: taskData.related_event_id || null,
        assigned_to: assignedToValue,
        assigned_by: assignedToValue ? profile.id : null,
        created_by: profile.id,
      }

      log.info('Creating task with data:', taskToInsert)

      // Create the task
      const { data: task, error } = await supabase
        .from('tasks')
        .insert([taskToInsert])
        .select()
        .single()

      if (error) {
        log.error('Error creating task:', error)
        log.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return NextResponse.json(
          {
            error: 'Failed to create task',
            details: error.message,
            code: error.code,
            hint: error.hint,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({ task })
    } catch (error) {
      log.error('Tasks API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: createTaskSchema,
    auditAction: 'create',
    auditResourceType: 'task',
  }
)
