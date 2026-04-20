"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Modifier = { id: string; name: string; price_delta: number }
type LinkRow = { menu_item_id: string; modifier_id: string }
type MenuItem = {
  id: string
  name?: string
  allergens?: string[] | null
  category?: string | null
  is_eighty_sixed?: boolean
}

export default function MenuEngineeringPage() {
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [links, setLinks] = useState<LinkRow[]>([])
  const [menuSample, setMenuSample] = useState<MenuItem[]>([])
  const [eightyList, setEightyList] = useState<MenuItem[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [modName, setModName] = useState("")
  const [modDelta, setModDelta] = useState("0")
  const [linkMenuItemId, setLinkMenuItemId] = useState("")
  const [linkModifierId, setLinkModifierId] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setErr(null)
      const mRes = await fetch("/api/operations/menu-modifiers", { cache: "no-store" })
      const iRes = await fetch("/api/menu-items?limit=40", { cache: "no-store" })
      const eRes = await fetch("/api/menu-items?eighty_sixed_only=1&limit=100", { cache: "no-store" })

      const mj = await mRes.json()
      const ij = await iRes.json()
      if (!mRes.ok) throw new Error(mj.error || "Could not load add-ons")
      if (!iRes.ok) throw new Error(ij.error || "Could not load menu")

      let eightyData: MenuItem[] = []
      if (eRes.ok) {
        const ej = await eRes.json()
        eightyData = (ej.data as MenuItem[]) || (ej.items as MenuItem[]) || []
      }

      setModifiers((mj.data?.modifiers as Modifier[]) || [])
      setLinks((mj.data?.links as LinkRow[]) || [])
      const items = (ij.data as MenuItem[]) || (ij.items as MenuItem[]) || []
      setMenuSample(items)
      setEightyList(eightyData)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong loading this page")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createModifier = async () => {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/operations/menu-modifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modName.trim(), price_delta: Number(modDelta) || 0 }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Create failed")
      setModName("")
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed")
    } finally {
      setBusy(false)
    }
  }

  const linkPair = async () => {
    if (!linkMenuItemId || !linkModifierId) {
      setErr("Pick both a menu item and an add-on")
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/operations/menu-modifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_item_id: linkMenuItemId, modifier_id: linkModifierId }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Link failed")
      setLinkMenuItemId("")
      setLinkModifierId("")
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Link failed")
    } finally {
      setBusy(false)
    }
  }

  const toggle86 = async (id: string, next: boolean) => {
    setErr(null)
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_eighty_sixed: next,
          eighty_sixed_at: next ? new Date().toISOString() : null,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error((j as { error?: string }).error || "Could not update item")
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update item")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Menu & 86’d items</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add-ons (modifiers), which items they apply to, and what is temporarily off. For full menu edits and
          allergens, use{" "}
          <Link href="/menu-management" className="text-primary underline">
            menu management
          </Link>
          .
        </p>
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New add-on</CardTitle>
            <CardDescription>Examples: extra shot, double, oat milk — and how much extra to charge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="mn" className="text-sm font-medium">
                Name
              </Label>
              <Input id="mn" value={modName} onChange={(e) => setModName(e.target.value)} placeholder="e.g. Extra shot" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="md" className="text-sm font-medium">
                Extra price
              </Label>
              <Input
                id="md"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={modDelta}
                onChange={(e) => setModDelta(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Use 0 if the add-on is free.</p>
            </div>
            <Button type="button" disabled={busy || !modName.trim()} onClick={() => void createModifier()}>
              Save add-on
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attach add-on to a dish or drink</CardTitle>
            <CardDescription>Choose the menu item and the add-on; guests will see them together where supported.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Menu item</Label>
              <Select value={linkMenuItemId || undefined} onValueChange={setLinkMenuItemId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a menu item" />
                </SelectTrigger>
                <SelectContent>
                  {menuSample.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name || "Unnamed item"}
                      {it.category ? ` · ${it.category}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add-on</Label>
              <Select value={linkModifierId || undefined} onValueChange={setLinkModifierId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an add-on" />
                </SelectTrigger>
                <SelectContent>
                  {modifiers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({Number(m.price_delta) >= 0 ? "+" : ""}
                      {m.price_delta})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              disabled={busy || !linkMenuItemId || !linkModifierId}
              variant="secondary"
              onClick={() => void linkPair()}
            >
              Link add-on
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">86’d list</CardTitle>
          <CardDescription>Items you have marked temporarily unavailable (86). Clear here when they are back on.</CardDescription>
        </CardHeader>
        <CardContent>
          {eightyList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing is 86’d right now.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {eightyList.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2"
                >
                  <span>
                    {it.name || it.id}
                    {it.category ? <span className="text-muted-foreground"> · {it.category}</span> : null}
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => void toggle86(it.id, false)}>
                    Back on menu
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add-ons</CardTitle>
            <CardDescription>Everything you have created for upsells and substitutions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {modifiers.length === 0 ? (
                <li className="text-muted-foreground">No add-ons yet.</li>
              ) : (
                modifiers.map((m) => (
                  <li key={m.id}>
                    {m.name} ({Number(m.price_delta) >= 0 ? "+" : ""}
                    {m.price_delta})
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample items & allergens</CardTitle>
            <CardDescription>
              <Link href="/menu-management" className="text-primary underline text-xs">
                Open menu management
              </Link>{" "}
              for allergens. Below you can quickly 86 an item for tonight.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 max-h-64 overflow-y-auto">
              {menuSample.slice(0, 16).map((it) => (
                <li key={it.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{it.name || it.id}</span>
                    {it.is_eighty_sixed ? <span className="ml-2 text-amber-700 text-xs">86</span> : null}
                    {it.allergens && it.allergens.length > 0 ? (
                      <div className="text-xs text-muted-foreground">Allergens: {it.allergens.join(", ")}</div>
                    ) : null}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant={it.is_eighty_sixed ? "secondary" : "outline"}
                    onClick={() => void toggle86(it.id, !it.is_eighty_sixed)}
                  >
                    {it.is_eighty_sixed ? "Back on menu" : "86 tonight"}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item ↔ add-on links</CardTitle>
          <CardDescription>{links.length} link(s) in use.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1 max-h-48 overflow-y-auto text-muted-foreground">
            {links.map((l, i) => {
              const itemName = menuSample.find((x) => x.id === l.menu_item_id)?.name
              const modNameHit = modifiers.find((x) => x.id === l.modifier_id)?.name
              return (
                <li key={`${l.menu_item_id}-${l.modifier_id}-${i}`}>
                  {itemName || "Item"} → {modNameHit || "Add-on"}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
