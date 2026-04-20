"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from "@/components/ui/theme-provider";
import MainLayout from '@/components/layout/MainLayout'
import { applyThemeContext } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { DashboardShellSkeleton } from '@/components/layout/DashboardShellSkeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    // Explicitly set CRM theme for dashboard routes
    applyThemeContext('crm');
    
    // Set the data-theme attribute directly to ensure it's applied
    document.documentElement.setAttribute('data-theme', 'crm');
  }, []);

  // Security check for admin access - use role from profiles table, not user_metadata
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      setCheckingRole(false);
      
      // Only redirect if role is explicitly 'customer'
      // Allow access for admin, staff, or null (which means role is being fetched)
      if (role === 'customer') {
        console.log('Customer attempted to access admin dashboard, redirecting to customer dashboard');
        router.push('/customer/dashboard');
      }
    } else if (!authLoading && !user) {
      // No user, redirect to login
      setCheckingRole(false);
      router.push('/login');
    }
  }, [user, authLoading, role, roleLoading, router]);

  // Show loading while checking authentication or role
  if (authLoading || roleLoading || checkingRole) {
    return (
      <DashboardShellSkeleton message="Checking your session…" />
    );
  }

  // Show loading while redirecting unauthorized users
  if (role === 'customer') {
    return (
      <DashboardShellSkeleton message="Redirecting to your customer dashboard…" />
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MainLayout>{children}</MainLayout>
    </ThemeProvider>
  );
} 