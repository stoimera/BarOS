import { normalizeVoucherCode } from '@/lib/loyalty/voucher-code'

describe('normalizeVoucherCode', () => {
  it('returns uppercase plain codes', () => {
    expect(normalizeVoucherCode('  ul-ab12cd34  ')).toBe('UL-AB12CD34')
  })

  it('extracts code from query string', () => {
    expect(normalizeVoucherCode('https://example.com/redeem?code=UL-XYZZZZZZZZ')).toBe('UL-XYZZZZZZZZ')
  })

  it('extracts voucher param', () => {
    expect(normalizeVoucherCode('https://x.test/?voucher=UL-AAAAAAAAAA')).toBe('UL-AAAAAAAAAA')
  })

  it('extracts UL- from embedded text', () => {
    expect(normalizeVoucherCode('scanned: UL-MM12345678 trailing')).toBe('UL-MM12345678')
  })
})
