import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

export const GET = withSecurity(
  async (_req, { scopedLocationId }) => {
    const supabase = await createClient()
    const today = new Date().toISOString().slice(0, 10)

    let bookingsQuery = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_date', today)
      .in('status', ['pending', 'confirmed'])

    if (scopedLocationId) {
      bookingsQuery = bookingsQuery.eq('location_id', scopedLocationId)
    }

    const { count: bookingsToday, error: bErr } = await bookingsQuery
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

    let ordersQuery = supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'active'])
    if (scopedLocationId) {
      ordersQuery = ordersQuery.eq('location_id', scopedLocationId)
    }
    const { count: openOrders, error: oErr } = await ordersQuery
    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })

    let oldestQ = supabase
      .from('orders')
      .select('opened_at')
      .in('status', ['open', 'active'])
      .order('opened_at', { ascending: true })
      .limit(1)
    if (scopedLocationId) {
      oldestQ = oldestQ.eq('location_id', scopedLocationId)
    }
    const { data: oldestRows, error: oldErr } = await oldestQ
    if (oldErr) return NextResponse.json({ error: oldErr.message }, { status: 500 })
    let oldestOpenMinutes: number | null = null
    const oldestRow = oldestRows?.[0] as { opened_at?: string } | undefined
    if (oldestRow?.opened_at) {
      oldestOpenMinutes = Math.floor((Date.now() - new Date(oldestRow.opened_at).getTime()) / 60000)
    }

    const { count: waitlistWaiting, error: wErr } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .eq('date', today)
      .eq('status', 'waiting')

    if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 })

    return NextResponse.json({
      data: {
        date: today,
        bookings_today: bookingsToday ?? 0,
        open_orders: openOrders ?? 0,
        waitlist_waiting: waitlistWaiting ?? 0,
        oldest_open_order_minutes: oldestOpenMinutes,
      },
    })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    requireLocationScoped: true,
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'visit',
  }
)
