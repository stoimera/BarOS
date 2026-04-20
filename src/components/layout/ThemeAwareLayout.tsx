"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getThemeContext, applyThemeContext } from '@/lib/theme';

interface ThemeAwareLayoutProps {
  children: React.ReactNode;
}

export function ThemeAwareLayout({ children }: ThemeAwareLayoutProps) {
  const pathname = usePathname();

  useEffect(() => {
    const context = getThemeContext(pathname);
    applyThemeContext(context);
  }, [pathname]);

  return <>{children}</>;
} 