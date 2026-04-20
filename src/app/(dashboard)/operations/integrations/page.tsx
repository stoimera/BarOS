"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/hooks/useUserRole"

type PluginSlice = {
  optional: true
  env_enabled: boolean
  ui_saved: boolean
  ui_enabled: boolean | null
  ingress_enabled: boolean
  env_flag: string
  credentials: Record<string, boolean>
  ready: boolean
}

type Payload = {
  note?: string
  stripe: PluginSlice
  twilio: PluginSlice
  resend: PluginSlice
  google_reviews: PluginSlice
}

type PluginKey = keyof Omit<Payload, "note">

const PLUGINS: { key: PluginKey; title: string; desc: string }[] = [
  { key: "stripe", title: "Stripe", desc: "Take card payments at the till or online." },
  { key: "twilio", title: "Twilio", desc: "Send SMS to guests (confirmations, waitlist)." },
  { key: "resend", title: "Resend", desc: "Send and receive email for the venue." },
  { key: "google_reviews", title: "Google reviews", desc: "Pull in Google ratings and replies." },
]

const CRED_LABELS: Record<string, string> = {
  publishable_key_set: "Card reader publishable key",
  secret_key_set: "Secret key",
  webhook_secret_set: "Webhook signing secret",
  account_sid_set: "Twilio account ID",
  auth_token_set: "Twilio API token",
  from_number_set: "Sending phone number",
  api_key_set: "Email API key",
  places_api_key_set: "Google Places key",
}

function humanCredLabel(key: string): string {
  return CRED_LABELS[key] || key.replace(/_set$/, "").replace(/_/g, " ")
}

function formatProbeMessage(provider: string, ok: boolean, body: unknown): string {
  if (!ok) {
    if (body && typeof body === "object" && body !== null && "error" in body) {
      const err = (body as { error?: string }).error
      if (typeof err === "string" && err.length > 0) return `${provider}: ${err}`
    }
    return `${provider}: test did not complete.`
  }
  return `${provider}: test completed successfully.`
}

export default function OperationsIntegrationsPage() {
  const { role } = useUserRole()
  const isAdmin = role === "admin"
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/operations/integrations/status", { cache: "no-store" })
      const json = (await res.json()) as { data?: Payload; error?: string }
      if (!res.ok) throw new Error(json.error || "Failed")
      setData(json.data ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const setPlugin = async (key: PluginKey, enabled: boolean) => {
    if (!isAdmin) return
    setSaving(key)
    setMsg(null)
    try {
      const res = await fetch("/api/operations/integrations/plugins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: enabled }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((j as { error?: string }).error || "Save failed")
      setMsg("Saved.")
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(null)
    }
  }

  const clearPlugin = async (pluginId: string) => {
    if (!isAdmin) return
    setSaving(pluginId)
    setMsg(null)
    try {
      const res = await fetch(`/api/operations/integrations/plugins?plugin_id=${encodeURIComponent(pluginId)}`, {
        method: "DELETE",
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((j as { error?: string }).error || "Clear failed")
      setMsg("Removed your saved on/off choice; the venue default applies again.")
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Clear failed")
    } finally {
      setSaving(null)
    }
  }

  const statusPhrase = (slice: PluginSlice) => {
    if (!slice.ingress_enabled) return "Turned off"
    if (slice.ready) return "Ready to use"
    return "On — finish setup"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Card payments, texts, email, and Google. “Ready to use” means the feature is on and sign-in details are
          complete. Only admins can change switches; everyone can see status.
        </p>
        {data?.note ? <p className="text-muted-foreground text-sm mt-2">{data.note}</p> : null}
      </div>
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      {!isAdmin ? (
        <p className="text-sm text-amber-700 dark:text-amber-200">
          Only an admin can turn connections on or off. You can still view what is configured.
        </p>
      ) : null}
      {data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {PLUGINS.map(({ key, title, desc }) => {
            const slice = data[key]
            if (!slice) return null
            return (
              <Card key={key}>
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base">{title}</CardTitle>
                      <CardDescription>{desc}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                      <Badge variant={slice.ready ? "default" : "secondary"}>{statusPhrase(slice)}</Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Live</span>
                        <Switch
                          checked={slice.ingress_enabled}
                          disabled={!isAdmin || saving === key}
                          onCheckedChange={(v) => void setPlugin(key, v)}
                          aria-label={`${title} live`}
                        />
                      </div>
                    </div>
                  </div>
                  <ul className="list-none space-y-1.5 pt-1 border-t border-border">
                    {Object.entries(slice.credentials).map(([k, v]) => (
                      <li key={k} className="text-sm text-muted-foreground">
                        <span className="text-foreground">{humanCredLabel(k)}:</span> {v ? "OK" : "Missing"}
                      </li>
                    ))}
                  </ul>
                  {isAdmin && slice.ui_saved ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving === key}
                      onClick={() => void clearPlugin(key)}
                    >
                      Reset to venue default
                    </Button>
                  ) : null}
                </CardHeader>
              </Card>
            )
          })}
        </div>
      ) : !error ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test connections</CardTitle>
          <CardDescription>
            Safe checks only — no card charges. Buttons work when that service shows as ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!data?.twilio?.ready}
              onClick={() =>
                void fetch("/api/integrations/twilio/sms", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ demo: true, body: "urban-bar-crm probe" }),
                }).then(async (r) => {
                  const j = await r.json().catch(() => ({}))
                  setMsg(formatProbeMessage("Twilio", r.ok, j))
                })
              }
            >
              Test SMS
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!data?.resend?.ready}
              onClick={() =>
                void fetch("/api/integrations/resend/inbound", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ demo: true }),
                }).then(async (r) => {
                  const j = await r.json().catch(() => ({}))
                  setMsg(formatProbeMessage("Resend", r.ok, j))
                })
              }
            >
              Test email
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!data?.google_reviews?.ready}
              onClick={() =>
                void fetch("/api/integrations/google/reviews-callback?demo=1", { method: "GET" }).then(async (r) => {
                  const j = await r.json().catch(() => ({}))
                  setMsg(formatProbeMessage("Google", r.ok, j))
                })
              }
            >
              Test Google link
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Card payments are tested from your Stripe dashboard or the Stripe mobile app, not from here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
