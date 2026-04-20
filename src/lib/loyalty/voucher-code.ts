/**
 * Normalize QR / pasted input into a redemption code (e.g. UL-AB12CD34EF).
 */
export function normalizeVoucherCode(raw: string): string {
  const t = raw.trim()
  if (!t) return ''

  try {
    const u = new URL(t)
    const q = u.searchParams.get('code') || u.searchParams.get('voucher') || u.searchParams.get('voucherCode')
    if (q?.trim()) return q.trim().toUpperCase()
  } catch {
    /* not a URL */
  }

  const m = t.match(/(UL-[A-Z0-9-]+)/i)
  if (m?.[1]) return m[1].toUpperCase()

  return t.toUpperCase()
}
