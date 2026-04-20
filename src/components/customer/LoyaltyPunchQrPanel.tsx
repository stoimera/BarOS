"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { toast } from "sonner"
import { format } from "date-fns"

type PunchKind = "coffee" | "alcohol"

type LoyaltyPunchQrPanelProps = {
  punchKind: PunchKind
  title: string
  ready: boolean
  onVoucherChange?: () => void
}

export function LoyaltyPunchQrPanel({ punchKind, title, ready, onVoucherChange }: LoyaltyPunchQrPanelProps) {
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [issuedFor, setIssuedFor] = useState<string | null>(null)

  const loadOrCreate = async () => {
    setLoading(true)
    try {
      const { data } = await api.post<{
        code: string
        expires_at: string
        reused?: boolean
        customer?: { id: string; name: string }
        punch_kind?: string
      }>("/customer/loyalty/punch-voucher", { punchKind })
      setCode(data.code)
      setExpiresAt(data.expires_at)
      setIssuedFor(data.customer?.name ?? null)
      onVoucherChange?.()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not create voucher"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ready || !code) {
      setQrDataUrl(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const QRCode = (await import("qrcode")).default
        const url = await QRCode.toDataURL(code, {
          width: 280,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        })
        if (!cancelled) setQrDataUrl(url)
      } catch {
        if (!cancelled) setQrDataUrl(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, ready])

  if (!ready) return null

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Your card is full. Tap below to show a one-time QR for staff. After they scan it at the bar,
        this reward is marked used and your punches start again.
      </p>
      {issuedFor ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Voucher issued for <span className="font-medium text-foreground">{issuedFor}</span> (your
          account).
        </p>
      ) : null}
      {!code ? (
        <Button className="mt-4" type="button" onClick={loadOrCreate} disabled={loading}>
          {loading ? "Preparing…" : "Show my QR code"}
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          {qrDataUrl ? (
            <div className="flex justify-center rounded-md border border-border bg-white p-3">
              {/* Data URL from qrcode — not suitable for next/image remote loader */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Reward QR code" width={280} height={280} className="h-auto max-w-full" />
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Generating QR…</p>
          )}
          <p className="text-center font-mono text-sm tracking-wide text-foreground">{code}</p>
          {expiresAt ? (
            <p className="text-center text-xs text-muted-foreground">
              Expires {format(new Date(expiresAt), "MMM d, yyyy")}
            </p>
          ) : null}
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={loadOrCreate} disabled={loading}>
            Refresh code if it expired
          </Button>
        </div>
      )}
    </div>
  )
}
