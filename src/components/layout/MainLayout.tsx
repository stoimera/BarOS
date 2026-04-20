"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Chatbot } from "@/components/shared/Chatbot"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { containerBg, border } from "@/styles/theme"

// Main layout component that wraps the entire dashboard application
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Manage sidebar collapsed state with localStorage persistence
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('sidebar-collapsed')
      if (savedState !== null) {
        setSidebarCollapsed(JSON.parse(savedState))
      }
    }

    // Initialize sidebar state from localStorage
    handleStorageChange()

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for custom events from same tab
    const handleSidebarToggle = () => {
      handleStorageChange()
    }
    window.addEventListener('sidebar-toggle', handleSidebarToggle)

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebar-toggle', handleSidebarToggle)
    }
  }, [])

  return (
    <div className={cn("flex min-h-screen", containerBg)}>
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content area with responsive layout */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          containerBg,
          "md:ml-0",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        {/* Header with navigation and user controls */}
        <Header />
        
        {/* Main content with responsive padding */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-6 sm:pb-8">
          <div className={cn("max-w-7xl mx-auto", containerBg)}>
            {children}
          </div>
        </main>
        
        {/* Footer separator */}
        <div className={cn("w-full border-t", border)} />
        
        {/* Footer component */}
        <Footer />
      </div>
      
      {/* Global chatbot component */}
      <Chatbot />
    </div>
  )
} 