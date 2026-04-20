"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  verifyTwoFactorCode, 
  verifyBackupCode,
  getTwoFactorStatus
} from '@/lib/auth'
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { AUTH_INPUT_CLASSNAME } from "@/app/(auth)/auth-styles"
import { Shield, Smartphone, XCircle, RefreshCw, CheckCircle } from "lucide-react"

const supabase = createClient()

interface TwoFactorVerificationProps {
  onSuccess: () => void
  onCancel: () => void
}

export function TwoFactorVerification({ onSuccess, onCancel }: TwoFactorVerificationProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const status = await getTwoFactorStatus()
      const isValid = status.enabled
        ? await verifyTwoFactorCode(code)
        : await verifyBackupCode(code)

      if (!isValid) {
        setError("Invalid verification code")
        return
      }

      onSuccess()
    } catch (verifyError) {
      console.error('2FA verification error:', verifyError)
      setError("Failed to verify code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      await supabase.auth.signOut()
      onCancel()
    } catch (cancelError) {
      console.error('Sign out error:', cancelError)
      onCancel()
    }
  }

  if (code.length === 6) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            Two-Factor Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <span className="text-sm">📱</span>
            <AlertDescription>
              Please enter the 6-digit code from your authenticator app to continue.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className={cn(AUTH_INPUT_CLASSNAME, "text-center text-lg tracking-widest")}
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <span className="text-sm">✗</span>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || code.length !== 6}>
                {loading ? <span className="h-4 w-4 animate-spin">⟳</span> : <span className="h-4 w-4">✓</span>}
                {loading ? "Verifying..." : "Verify"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            Please enter the 6-digit code from your authenticator app to continue.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className={cn(AUTH_INPUT_CLASSNAME, "text-center text-lg tracking-widest")}
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || code.length !== 6}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 