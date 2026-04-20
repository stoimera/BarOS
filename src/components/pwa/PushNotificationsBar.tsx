"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useUserRole } from "@/hooks/useUserRole"
import { X } from "lucide-react"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const DISMISS_KEY = "urban-pwa-push-bar-dismissed-v1"

export function PushNotificationsBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { role, loading: roleLoading } = useUserRole()
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(true)
  const [vapidOk, setVapidOk] = useState(false)

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1")
    } catch {
      setDismissed(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false)
      return
    }
    setSupported(true)
  }, [])

  const refreshSubscription = useCallback(async () => {
    if (!supported) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setSubscribed(!!sub)
  }, [supported])

  useEffect(() => {
    if (!user || roleLoading) return
    if (role !== "staff" && role !== "admin") return
    void (async () => {
      const res = await fetch("/api/push/vapid-public", { cache: "no-store" })
      setVapidOk(res.ok)
      if (res.ok) await refreshSubscription()
    })()
  }, [user, role, roleLoading, refreshSubscription])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported || busy) return
    setBusy(true)
    try {
      const keyRes = await fetch("/api/push/vapid-public", { cache: "no-store" })
      if (!keyRes.ok) return
      const { publicKey } = (await keyRes.json()) as { publicKey?: string }
      if (!publicKey) return

      const perm = await Notification.requestPermission()
      if (perm !== "granted") return

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = sub.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: json }),
      })
      if (res.ok) await refreshSubscription()
    } finally {
      setBusy(false)
    }
  }, [supported, busy, refreshSubscription])

  const unsubscribe = useCallback(async () => {
    if (!supported || busy) return
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setSubscribed(false)
        return
      }
      const endpoint = encodeURIComponent(sub.endpoint)
      await sub.unsubscribe()
      await fetch(`/api/push/subscribe?endpoint=${endpoint}`, { method: "DELETE" })
      setSubscribed(false)
    } finally {
      setBusy(false)
    }
  }, [supported, busy])

  if (
    pathname?.startsWith("/customer") ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return null
  }

  if (
    dismissed ||
    !user ||
    roleLoading ||
    (role !== "staff" && role !== "admin") ||
    !supported ||
    !vapidOk
  ) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/95 p-3 text-sm shadow-md backdrop-blur-sm md:left-auto md:right-4 md:max-w-lg">
      <span className="text-foreground">
        {subscribed ? "Browser alerts are on for this device." : "Get alerts on this device (optional)."}
      </span>
      <div className="flex items-center gap-2">
        {subscribed ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void unsubscribe()}>
            Turn off
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={busy} onClick={() => void subscribe()}>
            {busy ? "…" : "Enable"}
          </Button>
        )}
        <Button type="button" size="icon" variant="ghost" aria-label="Dismiss" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
