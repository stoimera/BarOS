"use client"

import { useState } from "react"
import { useProfile } from "@/hooks/useProfile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorAlert } from "@/components/ui/loading-states"
import { 
  User, 
  Settings, 
  Shield, 
  LogOut,
  Save,
  Edit,
  Eye,
  EyeOff,
  Key,
  Trash2,
  Camera
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { ProfileFormData } from "@/types/customer"
import { toast } from "sonner"
import Image from "next/image"
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup"
import { useTheme } from "next-themes"
import { DeleteAccountDialog } from "@/components/auth/DeleteAccountDialog"
import React from "react"

interface UserPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  darkMode: boolean
  language: string
  timezone: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { setTheme } = useTheme()
  
  // Use React Query hook for profile
  const {
    profile,
    isLoading,
    error,
    updateProfile,
    updatePassword,
    uploadAvatar,
    deleteAvatar,
    deleteAccount,
    isUpdating,
    isUpdatingPassword,
    isUploadingAvatar,
    isDeletingAvatar: _isDeletingAvatar,
    isDeletingAccount: _isDeletingAccount
  } = useProfile()

  const [editing, setEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    birthday: undefined,
    tags: [],
    notes: "",
    preferences: {}
  })
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    darkMode: false,
    language: "en",
    timezone: "UTC"
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || user?.email || "",
        birthday: profile.birthday ? new Date(profile.birthday) : undefined,
        tags: profile.tags || [],
        notes: profile.notes || "",
        preferences: profile.preferences || {}
      })
      if (profile.preferences) {
        setPreferences({
          emailNotifications: profile.preferences.emailNotifications ?? true,
          smsNotifications: profile.preferences.smsNotifications ?? false,
          marketingEmails: profile.preferences.marketingEmails ?? false,
          darkMode: profile.preferences.darkMode ?? false,
          language: profile.preferences.language || "en",
          timezone: profile.preferences.timezone || "UTC"
        })
      }
    }
  }, [profile, user?.email])

  const handleAvatarUpload = async (file: File) => {
    try {
      await uploadAvatar(file)
      toast.success("Avatar updated successfully")
    } catch {
      toast.error("Failed to upload avatar")
    }
  }

  const handleAvatarRemove = async () => {
    try {
      await deleteAvatar()
      toast.success("Avatar removed successfully")
    } catch {
      toast.error("Failed to remove avatar")
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        ...formData,
        preferences
      })
      setEditing(false)
      toast.success("Profile updated successfully")
    } catch {
      toast.error("Failed to update profile")
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      toast.success("Password updated successfully")
    } catch {
      toast.error("Failed to update password")
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch {
      toast.error("Failed to logout")
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount()
      toast.success("Account deleted successfully")
      router.push("/login")
    } catch {
      toast.error("Failed to delete account")
    }
  }

  void _isDeletingAvatar
  void _isDeletingAccount

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load profile"
          message={error.message}
          onRetry={() => {}}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {editing ? (
            <>
              <Button onClick={handleSaveProfile} disabled={isUpdating} className="bg-primary hover:bg-primary/90 text-white">
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button onClick={() => setEditing(false)} variant="outline">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} className="bg-primary hover:bg-primary/90 text-white">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-6">
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture and Name Fields */}
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {editing && (
                    <>
                      <Button
                        size="icon"
                        className="absolute -bottom-2 -right-2 h-8 w-8 bg-primary hover:bg-primary/90 text-white"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleAvatarUpload(file);
                          };
                          input.click();
                        }}
                        disabled={isUploadingAvatar}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      {profile?.avatar_url && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -bottom-2 -left-2 h-8 w-8"
                          onClick={handleAvatarRemove}
                          disabled={isUploadingAvatar}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editing}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday ? formData.birthday.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      birthday: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    disabled={!editing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={!editing}
                    placeholder="Add any additional notes...."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handlePasswordChange} 
                disabled={isUpdatingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Key className="h-4 w-4 mr-2" />
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preferences and Account Actions */}
        <div className="space-y-6">
          {/* Preferences */}
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email notifications</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                  disabled={!editing}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive SMS notifications</p>
                </div>
                <Switch
                  checked={preferences.smsNotifications}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, smsNotifications: checked })}
                  disabled={!editing}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive marketing emails</p>
                </div>
                <Switch
                  checked={preferences.marketingEmails}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, marketingEmails: checked })}
                  disabled={!editing}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => {
                    setPreferences({ ...preferences, darkMode: checked })
                    setTheme(checked ? "dark" : "light")
                  }}
                  disabled={!editing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Legal & Privacy */}
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Legal & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Privacy Policy & Terms</p>
                  <p className="text-xs text-muted-foreground">View our privacy policy and terms of service</p>
                </div>
                <Button 
                  onClick={() => router.push('/privacy')} 
                  variant="outline"
                  className="border-border text-primary hover:bg-muted"
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-foreground">Logout</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
                <Button onClick={handleLogout} variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded border border-border">
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Delete Account</p>
                  <p className="text-xs text-red-600 dark:text-red-300">Permanently delete your account and all data</p>
                </div>
                <Button 
                  onClick={() => setDeleteDialogOpen(true)} 
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Two-Factor Setup */}
      <TwoFactorSetup />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDeleteAccount}
      />
    </div>
  )
} 