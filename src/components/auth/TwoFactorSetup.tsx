"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  setupTwoFactor, 
  verifyTwoFactorCode, 
  getTwoFactorStatus,
  disableTwoFactor,
  generateNewBackupCodes,
  TwoFactorSetup as TwoFactorSetupType,
  TwoFactorStatus
} from '@/lib/auth'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

export function TwoFactorSetup() {
  const { user } = useAuth()
  const isOwner = user?.role === 'admin' || user?.user_metadata?.role === 'admin'

  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [setup, setSetup] = useState<TwoFactorSetupType | null>(null)
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup' | 'complete'>('status')
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const loadStatus = async () => {
    try {
      const currentStatus = await getTwoFactorStatus()
      setStatus(currentStatus)
      
      if (currentStatus.enabled) {
        setStep('complete')
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  if (!isOwner || !user) return null

  const handleSetup = async () => {
    setLoading(true)
    setError(null)
    try {
      const setupData = await setupTwoFactor()
      setSetup(setupData)
      setStep('verify')
    } catch (setupError) {
      console.error('Failed to setup 2FA:', setupError)
      setError("Failed to setup 2FA. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const isValid = await verifyTwoFactorCode(verificationCode)
      if (isValid) {
        setStep('backup')
        toast.success('Two-factor authentication enabled!')
      } else {
        setError('Invalid verification code')
      }
    } catch (verifyError) {
      console.error('Failed to verify 2FA:', verifyError)
      setError("Invalid verification code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      const success = await disableTwoFactor()
      if (success) {
        await loadStatus()
        setStep('status')
      }
    } catch {
      toast.error('Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBackupCodes = async () => {
    setLoading(true)
    try {
      const newCodes = await generateNewBackupCodes()
      if (setup) {
        setSetup({ ...setup, backup_codes: newCodes })
      }
    } catch {
      toast.error('Failed to generate backup codes')
    } finally {
      setLoading(false)
    }
  }

  const downloadBackupCodes = () => {
    if (!setup?.backup_codes) return
    
    const content = `Urban Lounge CRM - Backup Codes\n\n${setup.backup_codes.join('\n')}\n\nKeep these codes safe!`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (step === 'status') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <div className="space-y-4">
              <Alert>
                <span className="text-sm">✓</span>
                <AlertDescription>
                  Two-factor authentication is enabled. Your account is protected with an additional layer of security.
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Enabled
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {status.backup_codes_remaining} backup codes remaining
                </span>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDisable} variant="outline" disabled={loading}>
                  {loading ? <span className="h-4 w-4 animate-spin">⟳</span> : <span className="h-4 w-4">✗</span>}
                  Disable 2FA
                </Button>
                <Button onClick={handleGenerateBackupCodes} variant="outline" disabled={loading}>
                  <span className="text-sm">🔑</span>
                  Generate New Backup Codes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <span className="text-sm">🛡️</span>
                <AlertDescription>
                  Two-factor authentication adds an extra layer of security to your account by requiring a code from your authenticator app.
                </AlertDescription>
              </Alert>
              <Button onClick={handleSetup} disabled={loading}>
                {loading ? <span className="h-4 w-4 animate-spin">⟳</span> : <span className="h-4 w-4">📱</span>}
                Setup Two-Factor Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'verify') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            Setup Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Step 1: Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:
              </p>
              {setup?.qr_code && (
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                    {imageLoading && (
                      <Skeleton className="w-48 h-48 absolute inset-0" />
                    )}
                    {!imageError ? (
                      <Image
                        src={setup.qr_code}
                        alt="QR Code for 2FA setup"
                        fill
                        className={`transition-opacity duration-300 ${
                          imageLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageError(true);
                          setImageLoading(false);
                        }}
                        sizes="192px"
                        priority={true}
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">Failed to load QR code</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Step 2: Enter Verification Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the 6-digit code from your authenticator app:
              </p>
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                {error && (
                  <Alert variant="destructive">
                    <span className="text-sm">✗</span>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleVerify} disabled={loading || verificationCode.length !== 6}>
                {loading ? <span className="h-4 w-4 animate-spin">⟳</span> : <span className="h-4 w-4">✓</span>}
                Verify & Enable
              </Button>
              <Button onClick={() => setStep('status')} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'backup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">🔑</span>
            Backup Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <span className="text-sm">🔑</span>
            <AlertDescription>
              Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {setup?.backup_codes.map((code, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadBackupCodes} variant="outline">
              <span className="text-sm">⬇️</span>
              Download Codes
            </Button>
            <Button onClick={() => setStep('complete')}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg text-green-600">✓</span>
            Setup Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <span className="text-sm">✓</span>
            <AlertDescription>
              Two-factor authentication has been successfully enabled! Your account is now protected with an additional layer of security.
            </AlertDescription>
          </Alert>
          <Button onClick={() => {
            setStep('status')
          }}>
            Done
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
} 