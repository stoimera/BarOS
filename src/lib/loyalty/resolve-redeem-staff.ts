import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function resolveRedeemingStaffId(opts: {
  supabase: SupabaseClient
  user: { role: string; profileId: string }
  /** When set (e.g. admin redeeming on behalf), must match an active staff row */
  requestedStaffId?: string | null
}): Promise<{ staffId: string } | NextResponse> {
  const { supabase, user, requestedStaffId } = opts

  const { data: ownStaff, error: ownErr } = await supabase
    .from('staff')
    .select('id')
    .eq('profile_id', user.profileId)
    .eq('is_active', true)
    .maybeSingle()

  if (ownErr) {
    return NextResponse.json({ error: 'Could not resolve staff profile' }, { status: 500 })
  }

  if (ownStaff?.id) {
    if (requestedStaffId && requestedStaffId !== ownStaff.id) {
      return NextResponse.json(
        { error: 'staffId does not match your linked staff profile. Remove staffId for your own redemptions.' },
        { status: 403 }
      )
    }
    return { staffId: ownStaff.id }
  }

  if (user.role === 'admin' && requestedStaffId) {
    const { data: picked, error: pickErr } = await supabase
      .from('staff')
      .select('id')
      .eq('id', requestedStaffId)
      .eq('is_active', true)
      .maybeSingle()

    if (pickErr) {
      return NextResponse.json({ error: 'Could not validate staff id' }, { status: 500 })
    }
    if (!picked?.id) {
      return NextResponse.json(
        { error: 'Invalid or inactive staff id. Choose an active staff member to record this redemption.' },
        { status: 400 }
      )
    }
    return { staffId: picked.id }
  }

  return NextResponse.json(
    {
      error:
        'Your account is not linked to an active staff profile. Admins must pass staffId for the staff member who is handing the reward.',
    },
    { status: 403 }
  )
}
