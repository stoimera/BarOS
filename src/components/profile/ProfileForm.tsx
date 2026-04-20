"use client";
import { useState, useEffect } from "react";
import { FormField } from "@/components/forms/FormField"
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import Image from 'next/image';

const supabase = createClient();

interface ProfileFormProps {
  user: any;
  profile: any;
  onProfileUpdate?: (profile: any) => void;
  loading: boolean;
  showPreferences?: boolean;
  showAdminFields?: boolean;
}

export function ProfileForm({ user, profile, onProfileUpdate, loading, showPreferences = false, showAdminFields = false }: ProfileFormProps) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || "",
  });

  useEffect(() => {
    setForm({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      email: profile?.email || user?.email || "",
      phone: profile?.phone || "",
    });
  }, [profile?.first_name, profile?.last_name, profile?.email, profile?.phone, user?.email]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");
    // Basic validation
    if (!form.first_name.trim()) {
      setError("First name is required.");
      setSaving(false);
      return;
    }
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Valid email is required.");
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
      })
      .eq("user_id", user.id);
    if (error) setError(error.message);
    else {
      setSuccess("Profile updated successfully.");
      if (onProfileUpdate) onProfileUpdate({ ...profile, ...form });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError("");
    setSuccess("");
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, or WebP)");
      setUploading(false);
      return;
    }
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      setUploading(false);
      return;
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      setAvatarUrl(publicUrl);
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      if (updateError) throw updateError;
      setSuccess("Avatar uploaded successfully.");
      if (onProfileUpdate) onProfileUpdate({ ...profile, avatar_url: publicUrl });
    } catch {
      setError("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);
      if (error) throw error;
      setAvatarUrl(null);
      setSuccess("Avatar removed successfully.");
      if (onProfileUpdate) onProfileUpdate({ ...profile, avatar_url: null });
    } catch {
      setError("Failed to remove avatar");
    } finally {
      setUploading(false);
    }
  };

  void showPreferences;
  void showAdminFields;

  if (loading) return <Skeleton className="h-64 w-full rounded" />;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-4 space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && <Alert className="mb-2"><AlertTitle>Success</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="relative w-20 h-20">
          {avatarUrl ? (
            <>
              {avatarLoading && (
                <Skeleton className="w-20 h-20 rounded-full absolute inset-0" />
              )}
              {!avatarError ? (
                <Image
                  src={avatarUrl}
                  alt="Profile avatar"
                  fill
                  className={`rounded-full object-cover border transition-opacity duration-300 ${
                    avatarLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setAvatarLoading(false)}
                  onError={() => {
                    setAvatarError(true);
                    setAvatarLoading(false);
                  }}
                  sizes="80px"
                  priority={true}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl border">
                  <span className="text-gray-500 text-sm">?</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl border">
              <span className="text-gray-500 text-sm">?</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <input
            type="file"
            accept="image/*"
            onChange={e => e.target.files && handleAvatarUpload(e.target.files[0])}
            disabled={uploading}
            className="w-full sm:w-auto"
            aria-label="Upload profile picture"
          />
          {avatarUrl && (
            <Button 
              type="button" 
              variant="destructive" 
              size="sm" 
              onClick={handleAvatarRemove} 
              disabled={uploading} 
              className="w-full sm:w-auto"
              aria-label="Remove profile picture"
            >
              Remove
            </Button>
          )}
        </div>
      </div>
      
      <FormField
        label="First name"
        name="first_name"
        type="text"
        value={form.first_name}
        onChange={(value: string) => handleChange("first_name", value)}
        required
        disabled={saving}
      />
      <FormField
        label="Last name"
        name="last_name"
        type="text"
        value={form.last_name}
        onChange={(value: string) => handleChange("last_name", value)}
        disabled={saving}
      />
      
      <FormField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={(value: string) => handleChange("email", value)}
        required
        disabled={saving}
      />
      
      <FormField
        label="Phone"
        name="phone"
        type="text"
        value={form.phone}
        onChange={(value: string) => handleChange("phone", value)}
        disabled={saving}
      />
      
      {/* Add more fields here based on showPreferences/showAdminFields if needed */}
      <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? "Saving..." : "Save"}</Button>
    </form>
  );
} 