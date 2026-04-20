export function promoActiveAt(
  promo: { starts_at?: string | null; ends_at?: string | null; is_active?: boolean | null },
  at: Date = new Date()
): boolean {
  if (promo.is_active === false) return false
  if (promo.starts_at != null && promo.starts_at !== '' && new Date(promo.starts_at) > at) return false
  if (promo.ends_at != null && promo.ends_at !== '' && new Date(promo.ends_at) < at) return false
  return true
}
