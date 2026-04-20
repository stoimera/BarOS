/**
 * DSAR utilities (GDPR / similar privacy laws):
 * - Data portability (export JSON bundle)
 * - Erasure and anonymization
 *
 * Export coverage is best-effort across linked tables; extend as new customer-linked tables ship.
 */

import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { auditLog } from '@/lib/security/audit'
import type { NextRequest } from 'next/server'
import { assertNotLegalHold } from '@/lib/compliance/legal-hold'
import { createLogger } from '@/lib/logger'

const log = createLogger('lib.gdpr.data-export')

export interface DataExportRequest {
  customerId: string;
  userId?: string;
  organizationId?: string;
}

/**
 * Export all customer data in JSON format
 */
export async function exportCustomerData(
  customerId: string,
  userId?: string,
  organizationId?: string,
  req?: NextRequest
): Promise<Record<string, any>> {
  const supabase = await createServiceRoleClient()
  
  const [customer, bookings, visits, rewards, feedback, referrals, consentEvents, rsvps, loyaltyRows, orders, memberships, giftCards] =
    await Promise.all([
    // Customer profile
    supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single(),
    
    // Bookings
    supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId),
    
    // Visits
    supabase
      .from('visits')
      .select('*')
      .eq('customer_id', customerId),
    
    // Rewards
    supabase
      .from('rewards')
      .select('*')
      .eq('customer_id', customerId),
    
    // Feedback
    supabase
      .from('feedback')
      .select('*')
      .eq('customer_id', customerId),
    
    // Referrals
    supabase
      .from('referrals')
      .select('*')
      .or(`referrer_id.eq.${customerId},referee_id.eq.${customerId}`),

    supabase.from('marketing_consent_events').select('*').eq('customer_id', customerId),

    supabase.from('rsvps').select('*').eq('customer_id', customerId),

    supabase.from('loyalty').select('*').eq('customer_id', customerId),

    supabase.from('orders').select('*').eq('customer_id', customerId),

    supabase.from('customer_memberships').select('*').eq('customer_id', customerId),

    supabase.from('gift_cards').select('id, balance_cents, currency, status, issued_at, expires_at, customer_id').eq(
      'customer_id',
      customerId
    ),
  ])

  // Audit log the export
  await auditLog(
    {
      user_id: userId,
      organization_id: organizationId,
      action: 'export',
      resource_type: 'customer',
      resource_id: customerId,
      metadata: {
        export_type: 'full',
        timestamp: new Date().toISOString(),
      },
    },
    req
  );

  const c = customer.data as Record<string, unknown> | null

  return {
    export_date: new Date().toISOString(),
    metadata: {
      legal_hold: c?.legal_hold === true,
      legal_hold_reason: typeof c?.legal_hold_reason === 'string' ? c.legal_hold_reason : null,
      legal_hold_set_at: typeof c?.legal_hold_set_at === 'string' ? c.legal_hold_set_at : null,
    },
    customer: customer.data,
    bookings: bookings.data || [],
    visits: visits.data || [],
    rewards: rewards.data || [],
    feedback: feedback.data || [],
    referrals: referrals.data || [],
    marketing_consent_events: consentEvents.data || [],
    rsvps: rsvps.data || [],
    loyalty: loyaltyRows.data || [],
    orders: orders.data || [],
    customer_memberships: memberships.data || [],
    gift_cards: giftCards.data || [],
  }
}

/**
 * Delete all customer data (GDPR right to erasure)
 */
export async function deleteCustomerData(
  customerId: string,
  userId?: string,
  organizationId?: string,
  req?: NextRequest
): Promise<void> {
  const supabase = await createServiceRoleClient()

  await assertNotLegalHold(customerId)

  // First, export data for audit purposes
  const exportedData = await exportCustomerData(customerId, userId, organizationId, req);
  
  // Store export in audit log before deletion
  await auditLog(
    {
      user_id: userId,
      organization_id: organizationId,
      action: 'delete',
      resource_type: 'customer',
      resource_id: customerId,
      changes: {
        before: exportedData,
        after: undefined,
      },
      metadata: {
        deletion_reason: 'GDPR right to erasure',
        timestamp: new Date().toISOString(),
      },
    },
    req
  );

  // Delete in order to respect foreign key constraints
  // Note: Some tables may have CASCADE DELETE, but we'll be explicit
  
  await supabase.from('gift_cards').update({ customer_id: null }).eq('customer_id', customerId)

  await supabase.from('customer_memberships').delete().eq('customer_id', customerId)

  await supabase.from('orders').delete().eq('customer_id', customerId)

  await supabase.from('rsvps').delete().eq('customer_id', customerId)

  await supabase.from('loyalty').delete().eq('customer_id', customerId)

  const deleteOrder = ['referrals', 'feedback', 'rewards', 'visits', 'bookings', 'customers']

  for (const table of deleteOrder) {
    try {
      if (table === 'referrals') {
        await supabase
          .from(table)
          .delete()
          .or(`referrer_id.eq.${customerId},referee_id.eq.${customerId}`);
      } else {
        await supabase
          .from(table)
          .delete()
          .eq('customer_id', customerId);
      }
    } catch (error) {
      log.error(`Error deleting from ${table}:`, error)
      // Continue with other deletions even if one fails
    }
  }
}

/**
 * Anonymize customer data (alternative to deletion)
 */
export async function anonymizeCustomerData(
  customerId: string,
  userId?: string,
  organizationId?: string,
  req?: NextRequest
): Promise<void> {
  const supabase = await createServiceRoleClient()
  
  // Get customer data before anonymization
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (!customer) {
    throw new Error('Customer not found');
  }

  if (customer.legal_hold === true) {
    const reason =
      typeof customer.legal_hold_reason === 'string' && customer.legal_hold_reason.length > 0
        ? customer.legal_hold_reason
        : null
    throw new Error(reason ? `Customer is under legal hold: ${reason}` : 'Customer is under legal hold')
  }

  // Anonymize customer data
  await supabase
    .from('customers')
    .update({
      name: 'Anonymous',
      email: null,
      phone: null,
      address: null,
      date_of_birth: null,
      notes: '[Data anonymized per GDPR request]',
      ccpa_do_not_sell_or_share: false,
      ccpa_limit_sensitive_use: false,
    })
    .eq('id', customerId);

  // Audit log
  await auditLog(
    {
      user_id: userId,
      organization_id: organizationId,
      action: 'update',
      resource_type: 'customer',
      resource_id: customerId,
      changes: {
        before: customer,
        after: {
          ...customer,
          name: 'Anonymous',
          email: null,
          phone: null,
          address: null,
          date_of_birth: null,
        },
      },
      metadata: {
        anonymization_reason: 'GDPR request',
        timestamp: new Date().toISOString(),
      },
    },
    req
  );
}

