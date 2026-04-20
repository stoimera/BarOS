import { useState, useCallback, useRef } from 'react'
import { ValidationError } from './FormValidation'
import { ValidationRule } from './FormField'

export interface FormState<T> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
}

export interface UseFormOptions<T> {
  initialValues: T
  validationRules?: Record<string, ValidationRule>
  onSubmit: (values: T) => Promise<void> | void
  onError?: (errors: ValidationError[]) => void
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export interface UseFormReturn<T> {
  // State
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean

  // Actions
  setValue: (field: keyof T, value: any) => void
  setValues: (values: Partial<T>) => void
  setError: (field: keyof T, error: string) => void
  setErrors: (errors: Record<string, string>) => void
  setTouched: (field: keyof T, touched: boolean) => void
  setTouchedFields: (fields: Record<string, boolean>) => void
  reset: () => void
  resetField: (field: keyof T) => void
  validate: () => Promise<boolean>
  validateField: (field: keyof T) => Promise<boolean>
  handleSubmit: (e?: React.FormEvent) => Promise<void>

  // Field handlers
  register: (field: keyof T) => {
    value: any
    onChange: (value: any) => void
    onBlur: () => void
    error: string | undefined
    touched: boolean
  }
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  onError,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrorsState] = useState<Record<string, string>>({})
  const [touched, setTouchedState] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  const initialValuesRef = useRef(initialValues)
  const validationRulesRef = useRef(validationRules)

  // Update refs when props change
  if (initialValuesRef.current !== initialValues) {
    initialValuesRef.current = initialValues
  }
  if (validationRulesRef.current !== validationRules) {
    validationRulesRef.current = validationRules
  }

  // Validation function
  const validate = useCallback(async (): Promise<boolean> => {
    const { FormValidator } = await import('./FormValidation')
    
    const result = FormValidator.validateForm(values, validationRulesRef.current)
    const formattedErrors = FormValidator.formatErrors(result.errors)
    
    setErrorsState(formattedErrors)
    
    if (!result.isValid && onError) {
      onError(result.errors)
    }
    
    return result.isValid
  }, [values, onError])

  // Field validation
  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    const { FormValidator } = await import('./FormValidation')
    
    const fieldRules = validationRulesRef.current[field as string]
    if (!fieldRules) return true

    const error = FormValidator.validateField(field as string, values[field], fieldRules)
    
    if (error) {
      setErrorsState(prev => ({ ...prev, [field]: error.message }))
      return false
    } else {
      setErrorsState(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
      return true
    }
  }, [values])

  // Set single value
  const setValue = useCallback((field: keyof T, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    
    // Clear field error when value changes
    if (errors[field as string]) {
      setErrorsState(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
    
    // Validate on change if enabled
    if (validateOnChange) {
      validateField(field)
    }
  }, [errors, validateOnChange, validateField])

  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }))
    setIsDirty(true)
  }, [])

  // Set single error
  const setError = useCallback((field: keyof T, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }))
  }, [])

  // Set multiple errors
  const setErrors = useCallback((newErrors: Record<string, string>) => {
    setErrorsState(newErrors)
  }, [])

  // Set touched state
  const setTouched = useCallback((field: keyof T, touchedState: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: touchedState }))
  }, [])

  // Set multiple touched states
  const setTouchedFields = useCallback((fields: Record<string, boolean>) => {
    setTouchedState(prev => ({ ...prev, ...fields }))
  }, [])

  // Reset form
  const reset = useCallback(() => {
    setValuesState(initialValuesRef.current)
    setErrorsState({})
    setTouchedState({})
    setIsDirty(false)
    setIsSubmitting(false)
  }, [])

  // Reset single field
  const resetField = useCallback((field: keyof T) => {
    setValuesState(prev => ({ ...prev, [field]: initialValuesRef.current[field] }))
    setErrorsState(prev => {
      const newErrors = { ...prev }
      delete newErrors[field as string]
      return newErrors
    })
    setTouchedState(prev => ({ ...prev, [field]: false }))
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setIsSubmitting(true)
    
    try {
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true
        return acc
      }, {} as Record<string, boolean>)
      setTouchedState(allTouched)

      // Validate form
      const isValid = await validate()
      
      if (isValid) {
        await onSubmit(values)
        // Reset form after successful submission
        reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit, reset])

  // Field registration
  const register = useCallback((field: keyof T) => ({
    value: values[field],
    onChange: (value: any) => setValue(field, value),
    onBlur: async () => {
      setTouched(field, true)
      if (validateOnBlur) {
        await validateField(field)
      }
    },
    error: errors[field as string],
    touched: touched[field as string] || false,
  }), [values, errors, touched, setValue, setTouched, validateOnBlur, validateField])

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,

    // Actions
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    setTouchedFields,
    reset,
    resetField,
    validate,
    validateField,
    handleSubmit,

    // Field handlers
    register,
  }
} 