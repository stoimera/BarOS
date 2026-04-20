/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist, NetworkOnly } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

/** GET /api responses that must never be read from cache (multi-user / sensitive). */
const sensitiveApiGetMatcher = ({
  sameOrigin,
  url: { pathname },
}: {
  sameOrigin: boolean
  url: URL
}): boolean => {
  if (!sameOrigin || !pathname.startsWith("/api/")) return false
  const prefixes = [
    "/api/auth/",
    "/api/customers",
    "/api/bookings",
    "/api/staff",
    "/api/profile",
    "/api/gdpr",
    "/api/marketing",
    "/api/events",
    "/api/inventory",
    "/api/rewards",
    "/api/visits",
    "/api/tasks",
    "/api/schedule",
    "/api/rsvps",
    "/api/waitlist",
    "/api/push/",
  ]
  return prefixes.some((p) => pathname.startsWith(p) || pathname === p.replace(/\/$/, ""))
}

const apiSensitiveNoStore = {
  matcher: sensitiveApiGetMatcher,
  method: "GET" as const,
  handler: new NetworkOnly(),
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [apiSensitiveNoStore, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document"
        },
      },
    ],
  },
})

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data && (event.data as { type?: string }).type === "SKIP_WAITING") {
    void self.skipWaiting()
  }
})

self.addEventListener("push", (event: PushEvent) => {
  let title = "Urban Lounge"
  let body = "You have a new notification."
  let url = "/"
  try {
    if (event.data) {
      const j = event.data.json() as { title?: string; body?: string; url?: string }
      if (typeof j.title === "string") title = j.title
      if (typeof j.body === "string") body = j.body
      if (typeof j.url === "string") url = j.url
    }
  } catch {
    const t = event.data?.text()
    if (t) body = t
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon-128x128.png",
      badge: "/favicon-32x32.png",
      data: { url },
    })
  )
})

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close()
  const url =
    (event.notification.data && (event.notification.data as { url?: string }).url) || "/dashboard"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const w = clientList.find((c) => "focus" in c) as WindowClient | undefined
      if (w) {
        void w.focus()
        try {
          void w.navigate(url)
        } catch {
          void self.clients.openWindow(url)
        }
        return
      }
      return self.clients.openWindow(url)
    })
  )
})

serwist.addEventListeners()
