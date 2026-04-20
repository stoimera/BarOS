"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// import { createClient } from "@/utils/supabase/client" // No longer needed
import { InvitationCode } from "@/types/auth"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteInvitationCodeModal } from "./DeleteInvitationCodeModal"
import { CheckCircle, Clock, Copy } from "lucide-react"

// const supabase = createClient() // No longer needed

export function InvitationCodesList() {
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedCode, setCopiedCode] = useState<string>("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState<InvitationCode | null>(null)

  useEffect(() => {
    loadInvitationCodes()
  }, [])

  const loadInvitationCodes = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch("/api/invitation-codes")
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || "Failed to load invitation codes")
      setCodes(json.data || [])
    } catch (error: any) {
      console.error("Failed to load invitation codes:", error)
      setError("Failed to load invitation codes")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success("Code copied to clipboard!")
      setTimeout(() => setCopiedCode(""), 2000)
    } catch {
      toast.error("Failed to copy code")
    }
  }

  const deactivateCode = async (codeId: string) => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch(`/api/invitation-codes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: codeId, is_active: false })
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || "Failed to deactivate code")
      toast.success("Code deactivated")
      loadInvitationCodes()
    } catch (error: any) {
      console.error("Failed to deactivate code:", error)
      toast.error("Failed to deactivate code")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (code: InvitationCode) => {
    setCodeToDelete(code)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setCodeToDelete(null)
    setDeleteModalOpen(false)
  }

  const handleDeleteSuccess = () => {
    loadInvitationCodes()
  }

  const getStatusBadge = (code: InvitationCode) => {
    if (!code.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (code.used_by) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Used</Badge>
    }
    if (new Date() > new Date(code.expires_at)) {
      return <Badge variant="destructive">Expired</Badge>
    }
    return <Badge variant="outline">Active</Badge>
  }

  const getRoleIcon = (role: string) => {
    return role === "admin" ? <span className="text-sm">👑</span> : <span className="text-sm">👥</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (dateString: string) => {
    return new Date() > new Date(dateString)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Invitation Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Desktop Table Skeleton */}
            <div className="hidden md:block">
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mobile Card Skeleton */}
            <div className="md:hidden space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-3 w-12 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-12 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <span className="text-sm">✗</span>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {codes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm sm:text-base">No invitation codes found. Create one to invite staff members.</p>
        </div>
      ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Used By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {code.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                            disabled={copiedCode === code.code}
                          >
                            {copiedCode === code.code ? (
                              <span className="text-sm text-green-600">✓</span>
                            ) : (
                              <span className="text-sm">📋</span>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(code.role)}
                          <span className="capitalize">{code.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(code)}
                      </TableCell>
                      <TableCell>
                        {formatDate(code.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {formatDate(code.expires_at)}
                          {isExpired(code.expires_at) && (
                            <span className="text-xs text-red-500">⏰</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {code.used_by_user ? (
                          <div className="text-sm">
                            <div>{`${code.used_by_user.first_name || ''} ${code.used_by_user.last_name || ''}`.trim()}</div>
                            <div className="text-muted-foreground">{code.used_by_user.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not used</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {code.is_active && !code.used_by && !isExpired(code.expires_at) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deactivateCode(code.id)}
                              title="Deactivate code"
                            >
                              <span className="text-sm">✗</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(code)}
                            title="Delete code permanently"
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <span className="text-sm">🗑️</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(code.role)}
                      <span className="capitalize font-medium text-sm">{code.role}</span>
                    </div>
                    {getStatusBadge(code)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1">
                        {code.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                        disabled={copiedCode === code.code}
                      >
                        {copiedCode === code.code ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Created</div>
                      <div>{formatDate(code.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Expires</div>
                      <div className="flex items-center gap-1">
                        {formatDate(code.expires_at)}
                        {isExpired(code.expires_at) && (
                          <Clock className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Used By</div>
                    {code.used_by_user ? (
                      <div className="text-sm">
                        <div className="font-medium">{`${code.used_by_user.first_name || ''} ${code.used_by_user.last_name || ''}`.trim()}</div>
                        <div className="text-muted-foreground">{code.used_by_user.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not used</span>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex gap-2">
                      {code.is_active && !code.used_by && !isExpired(code.expires_at) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deactivateCode(code.id)}
                          className="flex-1"
                        >
                          <span className="mr-2">✗</span>
                          Deactivate
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(code)}
                        className="flex-1 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <span className="mr-2">🗑️</span>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      <DeleteInvitationCodeModal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onSuccess={handleDeleteSuccess}
        invitationCode={codeToDelete}
      />
    </>
  )
} 