"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Camera,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Profile, ProfileFormData } from "@/types/customer";
import { toast } from "sonner";
import Image from "next/image";
import { useTheme } from "next-themes";
import { DeleteAccountDialog } from "@/components/auth/DeleteAccountDialog";
import { 
  PageHeaderSkeleton,
  FormSkeleton,
  CardGridSkeleton
} from "@/components/ui/loading-states";

const supabase = createClient();

interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    birthday: undefined,
    tags: [],
    notes: "",
    preferences: {}
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    darkMode: false,
    language: "en",
    timezone: "UTC"
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const { setTheme, theme } = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profileData) {
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          email: profileData.email || user.email || "",
          birthday: profileData.birthday ? new Date(profileData.birthday) : undefined,
          tags: profileData.tags || [],
          notes: profileData.notes || "",
          preferences: profileData.preferences || {}
        });
        setAvatarUrl(profileData.avatar_url);
      } else {
        // Create new profile
        const newProfile = {
          user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.full_name?.split(' ')[0] || "",
          last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setProfile(createdProfile);
        setFormData({
          first_name: createdProfile.first_name || "",
          last_name: createdProfile.last_name || "",
          email: createdProfile.email || user.email || "",
          birthday: createdProfile.birthday ? new Date(createdProfile.birthday) : undefined,
          tags: createdProfile.tags || [],
          notes: createdProfile.notes || "",
          preferences: createdProfile.preferences || {}
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user) {
      void loadProfile();
    } else {
      router.push('/login');
    }
  }, [user, authLoading, router, loadProfile]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user || !avatarUrl) return;
    
    try {
      setUploading(true);
      
      // Remove from storage
      const filePath = avatarUrl.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('avatars')
          .remove([filePath]);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setAvatarUrl(null);
      toast.success('Avatar removed successfully');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          birthday: formData.birthday?.toISOString(),
          tags: formData.tags,
          notes: formData.notes,
          preferences: formData.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setEditing(false);
      toast.success('Profile updated successfully');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      if (error) {
        throw error;
      }
      toast.success('Account deleted successfully');
      router.push('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  void profile;
  void handleAvatarRemove;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeaderSkeleton showActions={false} />
          <CardGridSkeleton count={3} columns={1} />
          <FormSkeleton fields={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your account information and preferences</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setEditing(!editing)}
            className="w-full sm:w-auto text-sm"
          >
            {editing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Picture and Name Fields */}
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
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
                        disabled={uploading}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-sm font-medium">First Name</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                          disabled={!editing}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-sm font-medium">Last Name</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                          disabled={!editing}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!editing}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!editing}
                      className="text-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="text-sm font-medium">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={formData.birthday?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        birthday: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      disabled={!editing}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      disabled={!editing}
                      rows={3}
                      className="text-sm"
                      placeholder="Add any additional notes...."
                    />
                  </div>

                  {editing && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 text-sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="text-sm pr-10"
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="text-sm"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="text-sm"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="w-full sm:w-auto text-sm"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preferences and Account Actions */}
          <div className="space-y-6">
            {/* Preferences */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-white">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive email notifications</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-white">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive SMS notifications</p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-white">Marketing Emails</p>
                    <p className="text-xs text-muted-foreground">Receive promotional emails</p>
                  </div>
                  <Switch
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketingEmails: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-white">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Use dark theme</p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Legal & Privacy */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  Legal & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded border border-border">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Privacy Policy & Terms</p>
                    <p className="text-xs text-foreground">View our privacy policy and terms of service</p>
                  </div>
                  <Button 
                    onClick={() => router.push('/privacy')} 
                    variant="outline"
                    className="border-border text-primary hover:bg-muted text-sm"
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium dark:text-white">Logout</p>
                    <p className="text-xs text-muted-foreground">Sign out of your account</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded border border-border">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Delete Account</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Permanently delete your account and all data</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDeleteAccount}
      />
    </div>
  );
} 