"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { TwoFactorVerification } from "@/components/auth/TwoFactorVerification"
import { getTwoFactorStatus } from "@/lib/auth"
import { useAuth } from "@/hooks/useAuth"
import { AUTH_INPUT_CLASSNAME } from "@/app/(auth)/auth-styles"

const supabase = createClient()

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [show2FA, setShow2FA] = useState(false)
  const { user } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else if (data.session) {
      // Check if 2FA is enabled
      try {
        const twoFactorStatus = await getTwoFactorStatus()
        if (twoFactorStatus.enabled) {
          setShow2FA(true)
        } else {
          router.push("/dashboard")
        }
      } catch (twoFactorError) {
        // If 2FA check fails, proceed to dashboard
        console.error('2FA check failed:', twoFactorError)
        router.push("/dashboard")
      }
    }
    setLoading(false)
  }

  const handle2FASuccess = () => {
    router.push("/dashboard")
  }

  const handle2FACancel = async () => {
    await supabase.auth.signOut()
    setShow2FA(false)
    setError("")
  }

  // Only redirect if user is already authenticated and not in 2FA flow
  useEffect(() => {
    if (user && !show2FA) {
      if (user.user_metadata?.role === 'customer') {
        router.push('/customer/dashboard')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, router, show2FA])

  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <TwoFactorVerification 
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-rose-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">UL</span>
            </div>
            <span className="font-bold text-xl text-rose-800 dark:text-amber-400">Urban Lounge</span>
          </div>
          <CardTitle className="text-2xl text-amber-900 dark:text-amber-100">Sign in to your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-amber-900 dark:text-amber-100">Email</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className={AUTH_INPUT_CLASSNAME}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-amber-900 dark:text-amber-100">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className={`${AUTH_INPUT_CLASSNAME} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-amber-700 dark:text-amber-300">
            Don&apos;t have an account? <a href="/register" className="text-amber-600 dark:text-amber-400 underline hover:text-amber-700 dark:hover:text-amber-300">Register</a>
          </div>
          {user && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="text-xs text-amber-600 dark:text-amber-400"
              >
                Sign out and show login form
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 