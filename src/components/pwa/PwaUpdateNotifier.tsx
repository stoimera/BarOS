"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function PwaUpdateNotifier() {
  const refreshing = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const onControllerChange = () => {
      if (refreshing.current) return
      refreshing.current = true
      window.location.reload()
    }

    let cancelled = false

    void navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelled) return
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing
        if (!installing) return
        installing.addEventListener("statechange", () => {
          if (cancelled) return
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            toast.message("Update ready", {
              description: "Reload to use the latest version.",
              duration: 60_000,
              action: {
                label: "Reload",
                onClick: () => {
                  reg.waiting?.postMessage({ type: "SKIP_WAITING" })
                },
              },
            })
          }
        })
      })
    })

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)
    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  return null
}
