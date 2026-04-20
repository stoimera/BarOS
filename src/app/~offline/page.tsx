"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          This page opens when there is no network. Reconnect to Wi‑Fi or mobile data, then try again.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" type="button" onClick={() => (typeof window !== "undefined" ? window.location.reload() : undefined)}>
          Retry
        </Button>
      </div>
    </div>
  )
}
