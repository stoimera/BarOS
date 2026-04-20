"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle({ iconClassName = "", buttonClassName = "", dropdownClassName = "", dropdownItemClassName = "" }: { iconClassName?: string, buttonClassName?: string, dropdownClassName?: string, dropdownItemClassName?: string } = {}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only showing theme icon after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Determine current theme (light or dark)
  const currentTheme = mounted ? theme : 'light'
  const isDark = currentTheme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`hover:bg-muted hover:text-foreground ${buttonClassName}`}
        >
          <span className={`text-base ${iconClassName}`}>
            {isDark ? '🌙' : '☀️'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`border-border ${dropdownClassName}`}
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className={`focus:bg-muted focus:text-foreground ${dropdownItemClassName}`}
        >
          <span className="mr-2 text-base">☀️</span>
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className={`focus:bg-muted focus:text-foreground ${dropdownItemClassName}`}
        >
          <span className="mr-2 text-base">🌙</span>
          <span>Dark</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 