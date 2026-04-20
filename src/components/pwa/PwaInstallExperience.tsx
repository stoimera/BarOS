"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const iPadOS13 = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  return iOS || iPadOS13
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

const DISMISS_KEY = "urban-pwa-install-dismissed-v1"

export function PwaInstallExperience() {
  const pathname = usePathname()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (dismissed || isStandalone()) return
    if (isIos()) {
      setShowIos(true)
      return
    }
    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onBip)
    return () => window.removeEventListener("beforeinstallprompt", onBip)
  }, [dismissed])

  const dismiss = useCallback(() => {
    setDismissed(true)
    setShowIos(false)
    setDeferred(null)
    try {
      sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
  }, [])

  const installAndroid = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }, [deferred, dismiss])

  if (pathname?.startsWith("/customer")) return null
  if (dismissed || isStandalone()) return null

  if (deferred) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[100] flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-lg md:left-auto md:right-4 md:max-w-md">
        <p className="text-sm text-foreground">Install Urban Lounge on this device for quick access.</p>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={() => void installAndroid()}>
            Install
          </Button>
          <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={dismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (showIos) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[100] flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-lg md:left-auto md:right-4 md:max-w-md">
        <p className="text-sm text-foreground">
          <span className="font-medium">Add to Home Screen:</span> tap Share{" "}
          <span className="whitespace-nowrap">(□↑)</span>, then &quot;Add to Home Screen&quot;.
        </p>
        <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return null
}
