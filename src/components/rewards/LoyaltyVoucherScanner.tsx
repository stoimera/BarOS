"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { normalizeVoucherCode } from "@/lib/loyalty/voucher-code"
import { QrCode, Camera, CameraOff, CheckCircle } from "lucide-react"

type BarcodeDetectorCtor = new (opts: { formats: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null
  const BD = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  return BD ?? null
}

type LoyaltyVoucherScannerProps = {
  /** True when the signed-in user has a staff row, or an admin has chosen who records the redemption */
  canRedeem: boolean
  /** When the user is an admin without a staff row, pass the selected staff UUID to send as `staffId` */
  staffIdForRequestBody?: string
  onRedeemed?: () => void
}

export function LoyaltyVoucherScanner({
  canRedeem,
  staffIdForRequestBody,
  onRedeemed,
}: LoyaltyVoucherScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const zxingStopRef = useRef<(() => void) | null>(null)
  const redeemBusyRef = useRef(false)
  const [manualCode, setManualCode] = useState("")
  const [cameraOn, setCameraOn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSuccess, setLastSuccess] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    try {
      zxingStopRef.current?.()
    } catch {
      /* ignore */
    }
    zxingStopRef.current = null
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const v = videoRef.current
    if (v) {
      v.srcObject = null
    }
    setCameraOn(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const redeem = useCallback(
    async (raw: string) => {
      const voucherCode = normalizeVoucherCode(raw)
      if (!voucherCode) {
        toast.error("Enter or scan a voucher code")
        return
      }
      if (!canRedeem) {
        toast.error("Choose which staff member records this redemption (admin), or use a staff-linked login.")
        return
      }
      if (redeemBusyRef.current) return
      redeemBusyRef.current = true
      setSubmitting(true)
      setLastSuccess(null)
      try {
        const body: { voucherCode: string; staffId?: string } = { voucherCode }
        if (staffIdForRequestBody) {
          body.staffId = staffIdForRequestBody
        }
        const { data } = await api.post<{
          success: boolean
          message?: string
          reward?: { description?: string; customer?: { name?: string } }
        }>("/rewards/redeem", body)
        if (data.success) {
          const who = data.reward?.customer?.name ? ` for ${data.reward.customer.name}` : ""
          setLastSuccess(voucherCode)
          toast.success((data.message || "Redeemed") + who)
          setManualCode("")
          stopCamera()
          onRedeemed?.()
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Redeem failed"
        toast.error(msg)
      } finally {
        setSubmitting(false)
        redeemBusyRef.current = false
      }
    },
    [canRedeem, staffIdForRequestBody, onRedeemed, stopCamera]
  )

  const startCamera = async () => {
    if (!canRedeem) {
      toast.error("Choose a staff member to record redemptions before using the camera.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      streamRef.current = stream
      const v = videoRef.current
      if (!v) {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        toast.error("Video preview is not ready")
        return
      }
      v.srcObject = stream
      await v.play()
      setCameraOn(true)

      const BD = getBarcodeDetector()
      if (BD) {
        const detector = new BD({ formats: ["qr_code"] })
        const tick = async () => {
          const video = videoRef.current
          if (!video || video.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick)
            return
          }
          try {
            const codes = await detector.detect(video)
            if (codes.length > 0 && codes[0].rawValue && !redeemBusyRef.current) {
              await redeem(codes[0].rawValue)
              return
            }
          } catch {
            /* ignore frame errors */
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const { BrowserQRCodeReader } = await import("@zxing/browser")
      const reader = new BrowserQRCodeReader()
      const controls = await reader.decodeFromStream(stream, v, (result, _err, ctrl) => {
        const text = result?.getText()
        if (text && !redeemBusyRef.current) {
          try {
            ctrl.stop()
          } catch {
            /* ignore */
          }
          zxingStopRef.current = null
          void redeem(text)
        }
      })
      zxingStopRef.current = () => {
        try {
          controls.stop()
        } catch {
          /* ignore */
        }
      }
    } catch {
      toast.error("Could not access camera")
      stopCamera()
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5 text-primary" />
          Scan punch-card QR
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customer shows QR from Loyalty when their punch card is full. Scan here or type the code. Works in Chrome,
          Edge, and Safari (camera scan uses a fallback where built-in QR detection is unavailable).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canRedeem ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Choose which staff member should appear on this redemption (see above), or sign in with a
            staff profile that is linked in Staff Management.
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="voucher-code">Voucher code</Label>
            <Input
              id="voucher-code"
              placeholder="e.g. UL-ABCD123456 or paste a scanned URL"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button
            type="button"
            disabled={submitting || !canRedeem}
            onClick={() => redeem(manualCode)}
            className="sm:mb-0.5"
          >
            {submitting ? "Redeeming…" : "Redeem code"}
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="aspect-video max-h-56 overflow-hidden rounded-md bg-black/80">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!cameraOn ? (
              <Button type="button" variant="outline" size="sm" onClick={() => void startCamera()} disabled={!canRedeem}>
                <Camera className="mr-2 h-4 w-4" />
                Use camera
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={stopCamera}>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop camera
              </Button>
            )}
          </div>
        </div>

        {lastSuccess ? (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Last redeem OK. The customer&apos;s punch card has been cleared for the next round.</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
