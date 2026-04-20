"use client"

import { useState } from "react"
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserRole } from "@/types/auth"
import { toast } from "sonner"
import { CheckCircle } from "lucide-react"

interface InviteStaffModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function InviteStaffModal({ open, onClose, onSuccess }: InviteStaffModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [invitationData, setInvitationData] = useState({
    role: "staff" as UserRole,
    expiresIn: "7", // days
    maxUses: "1"
  })
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const generateInvitationCode = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/invitation-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: invitationData.role,
          expiresIn: invitationData.expiresIn,
          maxUses: invitationData.maxUses
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate invitation code')
      }

      setGeneratedCode(result.data.code)
      toast.success("Invitation code generated successfully!")
      onSuccess?.()
    } catch (error: any) {
      console.error("Failed to generate invitation code:", error)
      setError(error.message || "Failed to generate invitation code")
      toast.error("Failed to generate invitation code")
    } finally {
      setLoading(false)
    }
  }



  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      toast.success("Code copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy code")
    }
  }

  const handleClose = () => {
    onClose()
    setGeneratedCode("")
    setCopied(false)
    setError("")
    setInvitationData({
      role: "staff",
      expiresIn: "7",
      maxUses: "1"
    })
  }

  const roleOptions = [
    { value: "staff", label: "Staff" },
    { value: "admin", label: "Admin" }
  ]

  const expiresInOptions = [
    { value: "1", label: "1 day" },
    { value: "3", label: "3 days" },
    { value: "7", label: "7 days" },
    { value: "14", label: "14 days" },
    { value: "30", label: "30 days" }
  ]

  const maxUsesOptions = [
    { value: "1", label: "1 use" },
    { value: "5", label: "5 uses" },
    { value: "10", label: "10 uses" },
    { value: "unlimited", label: "Unlimited" }
  ]

  return (
    <>
      {!generatedCode ? (
        <FormModal
          open={open}
          onClose={handleClose}
          onSubmit={generateInvitationCode}
          title="Invite Staff Member"
          loading={loading}
          submitText="Generate Code"
          submitClassName="bg-blue-600 hover:bg-blue-700 text-white"
          size="md"
        >
          <div className="space-y-4">
            <FormField
              label="Role"
              name="role"
              type="select"
              value={invitationData.role}
              onChange={(value: string) => setInvitationData(prev => ({ ...prev, role: value as UserRole }))}
              options={roleOptions}
              disabled={loading}
            />

            <FormField
              label="Expires In"
              name="expiresIn"
              type="select"
              value={invitationData.expiresIn}
              onChange={(value: string) => setInvitationData(prev => ({ ...prev, expiresIn: value }))}
              options={expiresInOptions}
              disabled={loading}
            />

            <FormField
              label="Maximum Uses"
              name="maxUses"
              type="select"
              value={invitationData.maxUses}
              onChange={(value: string) => setInvitationData(prev => ({ ...prev, maxUses: value }))}
              options={maxUsesOptions}
              disabled={loading}
            />

            {error && (
              <Alert variant="destructive">
                <span className="text-sm">⚠</span>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </FormModal>
      ) : (
        <FormModal
          open={open}
          onClose={handleClose}
          onSubmit={async () => {}}
          title="Invitation Code Generated"
          submitText="Done"
          size="md"
          disableSubmit={true}
        >
          <div className="space-y-4">
            <Alert>
              <span className="text-sm">✓</span>
              <AlertDescription>
                Invitation code generated successfully! Share this code with the person you want to invite.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-base">🔑</span>
                  Invitation Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="font-mono text-lg text-center tracking-widest break-all">
                    {generatedCode}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">⏰</span>
                    Expires in {invitationData.expiresIn} days
                  </div>
                  <Badge variant="outline">
                    {invitationData.role}
                  </Badge>
                </div>

                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📋</span>
                      Copy Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Instructions:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Share this code with the person you want to invite</li>
                <li>They&apos;ll use it during registration</li>
                <li>The code will expire in {invitationData.expiresIn} days</li>
                <li>They can only use it once</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="w-full sm:flex-1">
                Done
              </Button>
              <Button 
                onClick={() => setGeneratedCode("")}
                className="w-full sm:flex-1"
              >
                Generate Another
              </Button>
            </div>
          </div>
        </FormModal>
      )}
    </>
  )
} 