import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThemeAwareLayout } from "@/components/layout/ThemeAwareLayout";
import { PwaClientSuite } from "@/components/pwa/PwaClientSuite";
import { QueryProvider } from "@/providers/QueryProvider";
import { apiClient, ApiError } from '@/lib/api/client';
import { toast } from 'sonner';

// Initialize Sentry on the client side (handled by instrumentation-client.ts)
// No manual import needed - Next.js handles this automatically

// Configure Google Fonts for the application
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configure global API client error handling and interceptors
apiClient.setGlobalErrorHandler((error: ApiError) => {
  toast.error(error.message);
  
  // Send to Sentry for tracking (only for server errors, not client errors)
  if (error.status >= 500 && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    try {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(new Error(error.message), {
          extra: {
            status: error.status,
            code: error.code,
          },
          tags: {
            error_type: 'api_error',
            status_code: error.status.toString(),
          },
        });
      }).catch(() => {
        // Sentry not available, ignore
      });
    } catch {
      // Sentry not available, ignore
    }
  }
  
  if (error.status === 401) {
    // Handle unauthorized access - redirect to login or clear auth state
  }
});

// Request interceptor for adding custom headers or logging
apiClient.setRequestInterceptor(async (config) => {
  // Add custom headers, logging, etc. if needed
  return config;
});

// Response interceptor for custom response handling
apiClient.setResponseInterceptor(async (response) => {
  // Custom response handling if needed
  return response;
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f59e0b",
}

// Application metadata and favicon configuration
export const metadata: Metadata = {
  title: "Urban Lounge CRM",
  description: "CRM system for urban lounges to manage customers, events, and operations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Urban Lounge",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon-256x256.png', sizes: '256x256', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon-128x128.png',
  },
};

// Root layout component that wraps the entire application
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Theme provider for dark/light mode support */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* React Query provider for data fetching and caching */}
          <QueryProvider>
            {/* Theme-aware layout wrapper */}
            <ThemeAwareLayout>
              {children}
            </ThemeAwareLayout>
            <PwaClientSuite />
            {/* Toast notifications */}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
