"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Authentication failed. Please try again.");
        return;
      }
      // Fetch the profile to check the role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (profileError || !profile) {
        setError("Could not fetch user profile. Please contact support.");
        return;
      }
      if (profile.role !== "customer") {
        setError("Only customers can sign in with Google.");
        await supabase.auth.signOut();
        return;
      }
      // Success: redirect to customer dashboard
      router.replace("/customer/dashboard");
    };
    checkRoleAndRedirect();
  }, [router, supabase]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded shadow text-center max-w-md w-full">
          <div className="text-red-600 font-semibold mb-2">{error}</div>
          <div className="text-gray-500 text-sm">You will be redirected to the login page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded shadow text-center max-w-md w-full">
        <div className="text-gray-700 font-semibold mb-2">Signing you in...</div>
      </div>
    </div>
  );
} 