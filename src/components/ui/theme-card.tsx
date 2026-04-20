"use client";

import { forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode;
}

interface ThemeCardHeaderProps extends React.ComponentProps<typeof CardHeader> {
  children: React.ReactNode;
}

interface ThemeCardTitleProps extends React.ComponentProps<typeof CardTitle> {
  children: React.ReactNode;
}

interface ThemeCardDescriptionProps extends React.ComponentProps<typeof CardDescription> {
  children: React.ReactNode;
}

interface ThemeCardContentProps extends React.ComponentProps<typeof CardContent> {
  children: React.ReactNode;
}

interface ThemeCardFooterProps extends React.ComponentProps<typeof CardFooter> {
  children: React.ReactNode;
}

export const ThemeCard = forwardRef<HTMLDivElement, ThemeCardProps>(
  ({ className, children, ...props }, ref) => {
    const { isCrm } = useTheme();
    
    const cardClasses = cn(
      isCrm 
        ? 'bg-background border-border' 
        : 'bg-card border-border',
      className
    );
    
    return (
      <Card ref={ref} className={cardClasses} {...props}>
        {children}
      </Card>
    );
  }
);

export const ThemeCardHeader = forwardRef<HTMLDivElement, ThemeCardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const { isCrm } = useTheme();
    
    const headerClasses = cn(
      isCrm 
        ? 'border-border' 
        : 'border-border',
      className
    );
    
    return (
      <CardHeader ref={ref} className={headerClasses} {...props}>
        {children}
      </CardHeader>
    );
  }
);

export const ThemeCardTitle = forwardRef<HTMLParagraphElement, ThemeCardTitleProps>(
  ({ className, children, ...props }, ref) => {
    const { getTextClasses } = useTheme();
    
    const titleClasses = cn(getTextClasses('primary'), className);
    
    return (
      <CardTitle ref={ref} className={titleClasses} {...props}>
        {children}
      </CardTitle>
    );
  }
);

export const ThemeCardDescription = forwardRef<HTMLParagraphElement, ThemeCardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    const { getTextClasses } = useTheme();
    
    const descriptionClasses = cn(getTextClasses('muted'), className);
    
    return (
      <CardDescription ref={ref} className={descriptionClasses} {...props}>
        {children}
      </CardDescription>
    );
  }
);

export const ThemeCardContent = forwardRef<HTMLDivElement, ThemeCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <CardContent ref={ref} className={className} {...props}>
        {children}
      </CardContent>
    );
  }
);

export const ThemeCardFooter = forwardRef<HTMLDivElement, ThemeCardFooterProps>(
  ({ className, children, ...props }, ref) => {
    const { isCrm } = useTheme();
    
    const footerClasses = cn(
      isCrm 
        ? 'border-border' 
        : 'border-border',
      className
    );
    
    return (
      <CardFooter ref={ref} className={footerClasses} {...props}>
        {children}
      </CardFooter>
    );
  }
);

ThemeCard.displayName = 'ThemeCard';
ThemeCardHeader.displayName = 'ThemeCardHeader';
ThemeCardTitle.displayName = 'ThemeCardTitle';
ThemeCardDescription.displayName = 'ThemeCardDescription';
ThemeCardContent.displayName = 'ThemeCardContent';
ThemeCardFooter.displayName = 'ThemeCardFooter'; 