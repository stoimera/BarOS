"use client"

import React, { forwardRef, useId } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"

// Supported field types for form inputs
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel'
  | 'url'
  | 'date' 
  | 'datetime-local' 
  | 'time' 
  | 'textarea' 
  | 'select' 
  | 'checkbox'
  | 'switch'
  | 'datepicker'
  | 'file'

// Option interface for select and checkbox fields
export interface FieldOption {
  value: string
  label: string
  disabled?: boolean
}

// Validation rules for form field validation
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  email?: boolean
  url?: boolean
  custom?: (value: any, formData?: Record<string, any>) => string | undefined
}

// Form field component props interface
export interface FormFieldProps {
  label: string
  name: string
  type?: FieldType
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  options?: FieldOption[]
  value?: any
  onChange?: (value: any) => void
  onBlur?: () => void
  className?: string
  min?: number
  max?: number
  step?: number
  rows?: number
  helpText?: string
  validation?: ValidationRule
  autoComplete?: string
  autoFocus?: boolean
  readOnly?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'filled' | 'outline'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
  inputClassName?: string
}

// Reusable form field component with multiple input types
export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  ({
    label,
    name,
    type = 'text',
    placeholder,
    required = false,
    disabled = false,
    error,
    options = [],
    value,
    onChange,
    onBlur,
    className,
    min,
    max,
    step,
    rows = 3,
    helpText,
    validation: _validation,
    autoComplete,
    autoFocus,
    readOnly,
    size = 'default',
    variant = 'default',
    leftIcon,
    rightIcon,
    containerClassName,
    labelClassName,
    inputClassName,
  }, ref) => {
    const id = useId()
    const fieldId = `${name}-${id}`
    const errorId = `${fieldId}-error`
    const helpId = `${fieldId}-help`
    void _validation

    const handleChange = (newValue: any) => {
      if (onChange) {
        onChange(newValue)
      }
    }

    const handleBlur = () => {
      if (onBlur) {
        onBlur()
      }
    }

    const getInputClassName = () => {
      const baseClasses = cn(
        "transition-all duration-200",
        {
          'h-8 text-sm px-3': size === 'sm',
          'h-10 text-base px-4': size === 'default',
          'h-12 text-lg px-6': size === 'lg',
        },
        {
          'bg-background border-input': variant === 'default',
          'bg-muted/50 border-transparent': variant === 'filled',
          'bg-transparent border-2': variant === 'outline',
        },
        error && "border-destructive focus-visible:ring-destructive/20",
        "border-border focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-2",
        "hover:border-blue-300",
        inputClassName
      )
      return cn(baseClasses, className)
    }

    const renderInput = () => {
      const commonProps = {
        id: fieldId,
        name,
        placeholder,
        disabled,
        readOnly,
        autoComplete,
        autoFocus,
        onBlur: handleBlur,
        'aria-describedby': cn(
          error && errorId,
          helpText && helpId
        ),
        'aria-invalid': !!error,
        'aria-required': required,
      }

      switch (type) {
        case 'textarea':
          return (
            <Textarea
              {...commonProps}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              rows={rows}
              className={getInputClassName()}
            />
          )

        case 'select':
          return (
            <Select
              value={value || ''}
              onValueChange={handleChange}
              disabled={disabled}
            >
              <SelectTrigger 
                className={cn(
                  getInputClassName(),
                  // Override all theme colors with blue for select
                  "border-border focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-2",
                  "hover:border-blue-300",
                  "text-blue-900",
                  "[&>span]:text-blue-900",
                  "!text-blue-900"
                )}
                aria-describedby={cn(
                  error && errorId,
                  helpText && helpId
                )}
                aria-invalid={!!error}
                aria-required={required}
              >
                <SelectValue 
                  placeholder={placeholder || `Select ${label.toLowerCase()}`}
                  className="!text-blue-900"
                />
              </SelectTrigger>
              <SelectContent className="border-border bg-background">
                {options.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.disabled}
                    className="focus:!bg-muted focus:!text-foreground data-[highlighted]:!bg-muted data-[highlighted]:!text-foreground data-[state=checked]:!bg-muted data-[state=checked]:!text-foreground hover:!bg-muted !text-foreground [&[data-state=checked]]:!bg-muted [&[data-state=checked]]:!text-foreground"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={fieldId}
                checked={!!value}
                onCheckedChange={handleChange}
                disabled={disabled}
                aria-describedby={cn(
                  error && errorId,
                  helpText && helpId
                )}
                aria-invalid={!!error}
                aria-required={required}
              />
              <Label 
                htmlFor={fieldId}
                className={cn("text-sm font-normal", labelClassName)}
              >
                {label}
              </Label>
            </div>
          )

        case 'switch':
          return (
            <div className="flex items-center space-x-2">
              <Switch
                id={fieldId}
                checked={!!value}
                onCheckedChange={handleChange}
                disabled={disabled}
                aria-describedby={cn(
                  error && errorId,
                  helpText && helpId
                )}
                aria-invalid={!!error}
                aria-required={required}
              />
              <Label 
                htmlFor={fieldId}
                className={cn("text-sm font-normal", labelClassName)}
              >
                {label}
              </Label>
            </div>
          )

        case 'datepicker':
          return (
            <DatePicker
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className={getInputClassName()}
            />
          )

        case 'file':
          return (
            <Input
              {...commonProps}
              ref={ref as React.Ref<HTMLInputElement>}
              type="file"
              onChange={(e) => handleChange(e.target.files?.[0] || null)}
              className={getInputClassName()}
            />
          )

        default:
          return (
            <div className="relative">
              {leftIcon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {leftIcon}
                </div>
              )}
              <Input
                {...commonProps}
                ref={ref as React.Ref<HTMLInputElement>}
                type={type}
                value={value || ''}
                onChange={(e) => handleChange(e.target.value)}
                min={min}
                max={max}
                step={step}
                className={cn(
                  getInputClassName(),
                  leftIcon && "pl-10",
                  rightIcon && "pr-10"
                )}
              />
              {rightIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {rightIcon}
                </div>
              )}
            </div>
          )
      }
    }

    // For checkbox and switch, render differently
    if (type === 'checkbox' || type === 'switch') {
      return (
        <div className={cn("space-y-2", containerClassName)}>
          {renderInput()}
          {helpText && (
            <p className="text-sm text-muted-foreground" id={helpId}>
              {helpText}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive" id={errorId} role="alert" aria-live="polite">
              {error}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className={cn("space-y-2", containerClassName)}>
        <Label 
          htmlFor={fieldId} 
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            required && "after:content-['*'] after:ml-0.5 after:text-destructive",
            labelClassName
          )}
        >
          {label}
        </Label>
        {renderInput()}
        {helpText && (
          <p className="text-sm text-muted-foreground" id={helpId}>
            {helpText}
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" id={errorId} role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField" 