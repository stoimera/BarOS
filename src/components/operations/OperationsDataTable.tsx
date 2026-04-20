"use client"

import { useEffect, useState } from "react"

type GenericRecord = Record<string, unknown>

interface OperationsDataTableProps {
  endpoint: string
  /** Optional query string without leading `?` (e.g. `anomalies_only=1`). */
  searchParams?: string
  /** When this value changes, the table refetches (e.g. after a sibling form creates a row). */
  refreshToken?: number
  title: string
  emptyLabel: string
}

export function OperationsDataTable({ endpoint, searchParams, refreshToken, title, emptyLabel }: OperationsDataTableProps) {
  const [rows, setRows] = useState<GenericRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const url = searchParams ? `${endpoint}?${searchParams}` : endpoint
        const response = await fetch(url, { cache: "no-store" })
        const payload = (await response.json()) as { data?: GenericRecord[]; error?: string }
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load data")
        }
        setRows(Array.isArray(payload.data) ? payload.data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [endpoint, searchParams, refreshToken])

  if (loading) return <p className="text-sm text-muted-foreground">Loading {title.toLowerCase()}...</p>
  if (error) return <p className="text-sm text-red-600">Failed to load: {error}</p>
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/15 px-4 py-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground leading-relaxed">{emptyLabel}</p>
      </div>
    )
  }

  const columns = Object.keys(rows[0]).slice(0, 6)

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-left font-medium capitalize">
                {column.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="border-t border-border">
              {columns.map((column) => (
                <td key={`${String(row.id ?? index)}-${column}`} className="px-3 py-2 align-top">
                  {formatValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.join(", ")
  return JSON.stringify(value)
}

