"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  User, 
  Users,
  Eye,
  EyeOff
} from "lucide-react"
import { UserRole, RegistrationData } from "@/types/auth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AUTH_INPUT_CLASSNAME } from "@/app/(auth)/auth-styles"

const supabase = createClient()

const authShellClass =
  "min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4"

const authCardClass = "w-full max-w-md border-border bg-card"

const roleOptionBase =
  "w-full flex items-center gap-3 p-4 border rounded-lg transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
const formLabelClass = "mb-2 inline-block"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    password: "",
    name: "",
    role: "customer",
    staff_invitation_code: "",
    owner_invitation_code: "",
    phone: "",
    referral_code: ""
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"role" | "details" | "invitation">("role")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")

  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }))
    if (role === "customer") {
      setStep("details")
    } else {
      setStep("invitation")
    }
  }

  const handleInvitationSubmit = async () => {
    setError("")
    if (!formData.staff_invitation_code && !formData.owner_invitation_code) {
      setError("Please enter an invitation code.")
      return
    }
    if (formData.staff_invitation_code && formData.owner_invitation_code) {
      setError("Please enter only one invitation code.")
      return
    }
    setLoading(true)
    try {
      let codeType: 'staff' | 'owner' | null = null
      let code = ""
      if (formData.owner_invitation_code) {
        codeType = 'owner'
        code = formData.owner_invitation_code
      } else if (formData.staff_invitation_code) {
        codeType = 'staff'
        code = formData.staff_invitation_code
      }
      // Validate invitation code
      const { data: invitation, error: inviteError } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('role', codeType)
        .eq('is_active', true)
        .single()
      if (inviteError || !invitation) {
        setError("Invalid or expired invitation code")
        setLoading(false)
        return
      }
      if (invitation.used_by) {
        setError("This invitation code has already been used")
        setLoading(false)
        return
      }
      if (new Date() > new Date(invitation.expires_at)) {
        setError("This invitation code has expired")
        setLoading(false)
        return
      }
      // Set role for registration
      setFormData(prev => ({
        ...prev,
        role: codeType === 'owner' ? 'admin' : 'staff', // map owner to admin role
        staff_invitation_code: codeType === 'staff' ? code : "",
        owner_invitation_code: codeType === 'owner' ? code : ""
      }))
      setStep("details")
    } catch (invitationError) {
      console.error('Invitation validation failed:', invitationError)
      setError("Failed to validate invitation code")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    setFormData(prev => ({ ...prev, password }))
    
    // Real-time password validation
    if (password.length > 0 && password.length < 8) {
      setPasswordError("Password must have at least 8 characters")
    } else {
      setPasswordError("")
    }

    // Check if confirm password matches
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
    } else {
      setConfirmPasswordError("")
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPass = e.target.value
    setConfirmPassword(confirmPass)
    
    // Real-time confirm password validation
    if (confirmPass && formData.password !== confirmPass) {
      setConfirmPasswordError("Passwords do not match")
    } else {
      setConfirmPasswordError("")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must have at least 8 characters")
      return
    }

    setLoading(true)

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
            phone: formData.phone
          }
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        
        // Handle specific Supabase auth errors
        if (authError.message.includes('30 seconds')) {
          throw new Error('Please wait 30 seconds before trying again. This is a security measure.')
        } else if (authError.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please try logging in instead.')
        } else if (authError.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.')
        } else {
          throw new Error(`Authentication error: ${authError.message}`)
        }
      }

      if (authData.user) {
        console.log('Creating profile for user:', authData.user.id)
        
        // Create user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            user_id: authData.user.id,
            email: formData.email,
            first_name: formData.name.split(' ')[0] || formData.name,
            last_name: formData.name.split(' ').slice(1).join(' ') || '',
            role: formData.role,
            phone: formData.phone,
            is_active: true
          }])
          .select()

        console.log('Profile creation result:', { profileData, profileError })

        if (profileError) {
          console.error('Profile error details:', profileError)
          throw new Error(`Profile creation error: ${profileError.message || 'Unknown error'}`)
        }

        if (!profileData || profileData.length === 0) {
          throw new Error('Profile was not created successfully')
        }

        // Create customer record if role is customer
        if (formData.role === 'customer' && profileData && profileData[0]) {
          console.log('Creating customer record for profile:', profileData[0].id)
          
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .insert([{
              profile_id: profileData[0].id,
              name: formData.name,
              email: formData.email,
              phone: formData.phone
            }])
            .select()

          console.log('Customer creation result:', { customerData, customerError })

          if (customerError) {
            console.error('Customer creation error:', customerError)
            // Don't fail registration if customer creation fails, but log it
          }
        }

        // Mark invitation code as used if applicable
        if (formData.owner_invitation_code || formData.staff_invitation_code) {
          await supabase
            .from('invitation_codes')
            .update({
              used_by: authData.user.id,
              used_at: new Date().toISOString()
            })
            .eq('code', formData.owner_invitation_code || formData.staff_invitation_code)
        }

        // Process referral code if provided
        if (formData.referral_code && formData.role === 'customer') {
          try {
            const { data: referrals, error: referralError } = await supabase
              .from('referrals')
              .select('*')
              .eq('referred_email', formData.email.toLowerCase())
              .single()

            if (!referralError && referrals) {
              // Update the referral with the new user ID
              await supabase
                .from('referrals')
                .update({
                  referred_user_id: authData.user.id
                })
                .eq('id', referrals.id)
            }
          } catch (referralError) {
            console.error('Error processing referral:', referralError)
            // Don't fail registration if referral processing fails
          }
        }

        toast.success("Account created successfully! Please check your email to confirm your registration.")
        
        // Redirect to login page after successful registration
        router.push("/login")
      }
    } catch (registrationError) {
      console.error('Registration error:', registrationError)
      const errorMessage = registrationError instanceof Error ? registrationError.message : "Failed to create account"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (step === "role") {
    return (
      <div className={authShellClass}>
        <Card className={authCardClass}>
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">Choose Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleRoleSelect("customer")}
                className={cn(
                  roleOptionBase,
                  formData.role === "customer"
                    ? "border-amber-600 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/55"
                    : "border-border bg-transparent hover:border-amber-400/70 hover:bg-amber-500/[0.06] dark:hover:bg-amber-400/10"
                )}
                aria-pressed={formData.role === "customer"}
              >
                <User className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex flex-col items-start gap-0.5">
                  <span
                    className={cn(
                      "font-medium",
                      formData.role === "customer"
                        ? "text-amber-950 dark:text-amber-50"
                        : "text-foreground"
                    )}
                  >
                    Customer
                  </span>
                  <span className="text-xs text-amber-900/75 dark:text-amber-200/85">
                    Join our loyalty program
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("staff")}
                className={cn(
                  roleOptionBase,
                  formData.role === "staff"
                    ? "border-amber-600 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/55"
                    : "border-border bg-transparent hover:border-amber-400/70 hover:bg-amber-500/[0.06] dark:hover:bg-amber-400/10"
                )}
                aria-pressed={formData.role === "staff"}
              >
                <Users className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex flex-col items-start gap-0.5">
                  <span
                    className={cn(
                      "font-medium",
                      formData.role === "staff"
                        ? "text-amber-950 dark:text-amber-50"
                        : "text-foreground"
                    )}
                  >
                    Staff Member
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-amber-200/85">
                    Work at the bar
                  </span>
                </div>
              </button>
            </div>
            <div className="mt-4 text-xs text-amber-800/90 dark:text-amber-200/90">
              {formData.role === "customer" &&
                "Access to loyalty program and events. Cannot access staff features."}
              {formData.role === "staff" &&
                "Access to daily operations. Cannot delete data or access admin settings unless you use an admin invitation code."}
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="flex-1 border-amber-400 text-amber-700 hover:text-amber-800 hover:bg-amber-50 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-600 dark:text-amber-300 dark:hover:text-amber-200 dark:hover:bg-amber-950/40 dark:focus:border-amber-400 dark:focus:ring-amber-400"
              >
                Back to Login
              </Button>
              <Button
                onClick={() => handleRoleSelect(formData.role)}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold focus:ring-amber-500"
                disabled={!formData.role}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "invitation" && formData.role === "staff") {
    return (
      <div className={authShellClass}>
        <Card className={authCardClass}>
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">Staff Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleInvitationSubmit(); }}>
              <div>
                <Label className={formLabelClass} htmlFor="owner_invitation_code">Admin Invitation Code</Label>
                <Input
                  id="owner_invitation_code"
                  type="text"
                  value={formData.owner_invitation_code}
                  onChange={e => setFormData(prev => ({ ...prev, owner_invitation_code: e.target.value, staff_invitation_code: "" }))}
                  placeholder="Enter admin/owner code if you are an admin"
                  disabled={loading}
                  className={AUTH_INPUT_CLASSNAME}
                />
              </div>
              <div>
                <Label className={formLabelClass} htmlFor="staff_invitation_code">Staff Invitation Code</Label>
                <Input
                  id="staff_invitation_code"
                  type="text"
                  value={formData.staff_invitation_code}
                  onChange={e => setFormData(prev => ({ ...prev, staff_invitation_code: e.target.value, owner_invitation_code: "" }))}
                  placeholder="Enter staff code if you are regular staff"
                  disabled={loading}
                  className={AUTH_INPUT_CLASSNAME}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold focus:ring-amber-500"
              disabled={loading}
            >
              {loading ? "Validating..." : "Continue"}
            </Button>
            </form>
            <div className="mt-4 text-center text-sm text-amber-700 dark:text-amber-300">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-amber-600 dark:text-amber-400 underline hover:text-amber-700 dark:hover:text-amber-300"
              >
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "details" && formData.role === "customer") {
    return (
      <div className={authShellClass}>
        <Card className={authCardClass}>
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">Register as Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <Label className={formLabelClass} htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={loading}
                  className={AUTH_INPUT_CLASSNAME}
                />
              </div>

              <div>
                <Label className={formLabelClass} htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={loading}
                  className={AUTH_INPUT_CLASSNAME}
                />
              </div>

              <div>
                <Label className={formLabelClass} htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={loading}
                  className={AUTH_INPUT_CLASSNAME}
                />
              </div>

              {formData.role === 'customer' && (
                <div>
                  <Label className={formLabelClass} htmlFor="referral_code">Referral Code (Optional)</Label>
                  <Input
                    id="referral_code"
                    type="text"
                    placeholder="Enter friend's referral code"
                    value={formData.referral_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, referral_code: e.target.value }))}
                    disabled={loading}
                    className={AUTH_INPUT_CLASSNAME}
                  />
                </div>
              )}

              <div>
                <Label className={formLabelClass} htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    className={cn(
                      AUTH_INPUT_CLASSNAME,
                      "pr-10",
                      passwordError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/40"
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                )}
              </div>

              <div>
                <Label className={formLabelClass} htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={loading}
                    className={cn(
                      AUTH_INPUT_CLASSNAME,
                      "pr-10",
                      confirmPasswordError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/40"
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-red-500 mt-1">{confirmPasswordError}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold focus:ring-amber-500"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
            </form>

            <div className="mt-4 text-center text-sm text-amber-700 dark:text-amber-300">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-amber-600 dark:text-amber-400 underline hover:text-amber-700 dark:hover:text-amber-300"
              >
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={authShellClass}>
      <Card className={authCardClass}>
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">Create your account</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {formData.role === "staff" && <Users className="h-3 w-3 mr-1" />}
              {formData.role === "customer" && <User className="h-3 w-3 mr-1" />}
              {formData.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <Label className={formLabelClass} htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
                className={AUTH_INPUT_CLASSNAME}
              />
            </div>

            <div>
              <Label className={formLabelClass} htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={loading}
                className={AUTH_INPUT_CLASSNAME}
              />
            </div>

            <div>
              <Label className={formLabelClass} htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={loading}
                className={AUTH_INPUT_CLASSNAME}
              />
            </div>

            {formData.role === 'customer' && (
              <div>
                <Label className={formLabelClass} htmlFor="referral_code">Referral Code (Optional)</Label>
                <Input
                  id="referral_code"
                  type="text"
                  placeholder="Enter friend's referral code"
                  value={formData.referral_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, referral_code: e.target.value }))}
                  disabled={loading}
                  className={AUTH_INPUT_CLASSNAME}
                />
              </div>
            )}

            <div>
              <Label className={formLabelClass} htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  className={cn(
                    AUTH_INPUT_CLASSNAME,
                    "pr-10",
                    passwordError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/40"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            <div>
              <Label className={formLabelClass} htmlFor="confirmPassword">Confirm Password</Label>
                              <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={loading}
                    className={cn(
                      AUTH_INPUT_CLASSNAME,
                      "pr-10",
                      confirmPasswordError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/40"
                    )}
                  />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {confirmPasswordError && (
                <p className="text-sm text-red-500 mt-1">{confirmPasswordError}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("role")}
                className="flex-1 border-amber-400 text-amber-700 hover:text-amber-800 hover:bg-amber-50 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-600 dark:text-amber-300 dark:hover:text-amber-200 dark:hover:bg-amber-950/40 dark:focus:border-amber-400 dark:focus:ring-amber-400"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold focus:ring-amber-500"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm text-amber-700 dark:text-amber-300">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-amber-600 dark:text-amber-400 underline hover:text-amber-700 dark:hover:text-amber-300"
            >
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 