"use client";

import { usePathname } from 'next/navigation';
import { getThemeContext } from '@/lib/theme';

// Theme hook for context-aware styling based on current page
export function useTheme() {
  const pathname = usePathname();
  const context = getThemeContext(pathname);

  const isPublic = context === 'public';
  const isCrm = context === 'crm';

  // Get theme-aware class names based on current context
  const getClasses = (publicClasses: string, crmClasses?: string) => {
    if (isCrm && crmClasses) {
      return crmClasses;
    }
    return publicClasses;
  };

  // Get theme-aware background classes for different contexts
  const getBackgroundClasses = () => {
    if (isCrm) {
      return 'bg-background';
    }
    return 'bg-gradient-to-br from-blue-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900';
  };

  // Get theme-aware header classes for navigation
  const getHeaderClasses = () => {
    if (isCrm) {
      return 'bg-background border-border';
    }
    return 'bg-neutral-50 dark:bg-slate-900 border-border';
  };

  // Get theme-aware button classes with variant support
  const getButtonClasses = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    if (isCrm) {
      switch (variant) {
        case 'primary':
          return 'bg-primary hover:bg-primary/90 text-white';
        case 'secondary':
          return 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white';
        case 'outline':
          return 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800';
        default:
          return 'bg-primary hover:bg-primary/90 text-white';
      }
    } else {
      switch (variant) {
        case 'primary':
          return 'bg-primary hover:bg-primary/90 text-white';
        case 'secondary':
          return 'bg-muted hover:bg-muted/80 text-foreground';
        case 'outline':
          return 'border-primary text-primary hover:bg-muted';
        default:
          return 'bg-primary hover:bg-primary/90 text-white';
      }
    }
  };

  // Get theme-aware text classes with variant support
  const getTextClasses = (variant: 'primary' | 'secondary' | 'muted' = 'primary') => {
    if (isCrm) {
      switch (variant) {
        case 'primary':
          return 'text-slate-900 dark:text-white';
        case 'secondary':
          return 'text-slate-700 dark:text-slate-300';
        case 'muted':
          return 'text-slate-500 dark:text-slate-400';
        default:
          return 'text-slate-900 dark:text-white';
      }
    } else {
      switch (variant) {
        case 'primary':
          return 'text-primary';
        case 'secondary':
          return 'text-foreground';
        case 'muted':
          return 'text-muted-foreground';
        default:
          return 'text-primary';
      }
    }
  };

  return {
    context,
    isPublic,
    isCrm,
    getClasses,
    getBackgroundClasses,
    getHeaderClasses,
    getButtonClasses,
    getTextClasses,
  };
} 