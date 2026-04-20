"use client";

import { forwardRef } from 'react';
import { Button, buttonVariants } from './button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { type VariantProps } from 'class-variance-authority';

interface ThemeButtonProps extends React.ComponentProps<"button">, 
  VariantProps<typeof buttonVariants> {
  themeVariant?: 'primary' | 'secondary' | 'outline';
  asChild?: boolean;
}

export const ThemeButton = forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({ className, themeVariant = 'primary', variant, size, asChild = false, ...props }, ref) => {
    const { getButtonClasses } = useTheme();
    
    const themeClasses = getButtonClasses(themeVariant);
    
    return (
      <Button
        ref={ref}
        className={cn(themeClasses, className)}
        variant={variant}
        size={size}
        asChild={asChild}
        {...props}
      />
    );
  }
);

ThemeButton.displayName = 'ThemeButton'; 