"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FormFieldOption {
  value: string
  label: string
}

interface FormFieldProps {
  label: string
  value?: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date" | "time" | "datetime-local" | "textarea" | "select"
  options?: FormFieldOption[]
  required?: boolean
  disabled?: boolean
  rows?: number
  min?: number
  max?: number
  step?: number
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  options = [],
  required = false,
  disabled = false,
  rows = 3,
  min,
  max,
  step
}: FormFieldProps) {
  // Convert undefined to empty string for internal use
  const displayValue = value ?? ""

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleSelectChange = useCallback((value: string) => {
    onChange(value);
  }, [onChange]);

  if (type === "textarea") {
    return (
      <div className="space-y-2">
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Textarea
          id={label.toLowerCase().replace(/\s+/g, '-')}
          value={displayValue}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className="w-full"
        />
      </div>
    )
  }

  if (type === "select") {
    return (
      <div className="space-y-2">
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select value={displayValue} onValueChange={handleSelectChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={label.toLowerCase().replace(/\s+/g, '-')}
        type={type}
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  )
} 