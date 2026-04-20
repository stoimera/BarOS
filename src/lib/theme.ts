// Theme system types for light/dark mode and context
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeContext = 'public' | 'crm';

// Routes that use the public-facing theme (customer portal)
export const PUBLIC_ROUTES = [
  '/',
  '/menu',
  '/auth/callback',
  '/checkin',
  '/test-connection'
];

// Routes that use the internal CRM theme (admin dashboard)
export const CRM_ROUTES = [
  '/dashboard',
  '/analytics',
  '/bookings',
  '/calendar',
  '/customers',
  '/events',
  '/event-templates',
  '/feedback',
  '/inventory',
  '/marketing',
  '/menu-management',
  '/profile',
  '/referrals',
  '/rewards',
  '/schedule',
  '/staff',
  '/tasks',
  '/visits'
];

// Determine the theme context based on the current pathname
export function getThemeContext(pathname: string): ThemeContext {
  // Check if the pathname starts with any CRM route
  const isCrmRoute = CRM_ROUTES.some(route => 
    pathname.startsWith(route) || pathname.startsWith(`/customer${route}`)
  );
  
  return isCrmRoute ? 'crm' : 'public';
}

// Apply the appropriate theme context to the document element
export function applyThemeContext(context: ThemeContext) {
  const html = document.documentElement;
  
  if (context === 'crm') {
    html.setAttribute('data-theme', 'crm');
  } else {
    html.removeAttribute('data-theme');
  }
}

// Get theme-aware class names based on context
export function getThemeClasses(context: ThemeContext, baseClasses: string, crmClasses?: string): string {
  if (context === 'crm' && crmClasses) {
    return crmClasses;
  }
  return baseClasses;
}

// CSS Variables for theme-aware styling with color schemes
export const themeVariables = {
  public: {
    light: {
      primary: '#3B82F6',
      secondary: '#2563EB',
      accent: '#3B82F6',
      surface: '#F9FAFB',
      background: '#FAFAFA',
      text: '#1F2937',
    },
    dark: {
      primary: '#60A5FA',
      secondary: '#3B82F6',
      accent: '#60A5FA',
      surface: '#0F172A',
      background: '#1F2937',
      text: '#F9FAFB',
    }
  },
  crm: {
    light: {
      primary: '#3B82F6',
      secondary: '#2563EB',
      accent: '#1D4ED8',
      surface: '#F9FAFB',
      background: '#FFFFFF',
      text: '#1E293B',
    },
    dark: {
      primary: '#60A5FA',
      secondary: '#3B82F6',
      accent: '#2563EB',
      surface: '#0F172A',
      background: '#020617',
      text: '#F3F4F6',
    }
  },
  status: {
    error: '#EF4444',
    success: '#10B981',
    warning: '#3B82F6',
    info: '#3B82F6',
  }
}; 