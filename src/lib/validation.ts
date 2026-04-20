import { z } from 'zod'
import { VALIDATION_RULES } from './constants'

// Base schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(VALIDATION_RULES.EMAIL.MAX_LENGTH, `Email must be no more than ${VALIDATION_RULES.EMAIL.MAX_LENGTH} characters`)

export const passwordSchema = z
  .string()
  .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`)
  .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH, `Password must be no more than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`)

export const nameSchema = z
  .string()
  .min(VALIDATION_RULES.NAME.MIN_LENGTH, `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`)
  .max(VALIDATION_RULES.NAME.MAX_LENGTH, `Name must be no more than ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`)

export const phoneSchema = z
  .string()
  .max(VALIDATION_RULES.PHONE.MAX_LENGTH, `Phone must be no more than ${VALIDATION_RULES.PHONE.MAX_LENGTH} characters`)
  .optional()

export const notesSchema = z
  .string()
  .max(VALIDATION_RULES.NOTES.MAX_LENGTH, `Notes must be no more than ${VALIDATION_RULES.NOTES.MAX_LENGTH} characters`)
  .optional()

export const tagsSchema = z.array(z.string()).default([])

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

// Customer schemas
export const customerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema,
  birthday: z.date().optional(),
  tags: tagsSchema,
  notes: notesSchema,
})

export const customerFiltersSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasLoyalty: z.boolean().optional(),
  visitedAfter: z.date().optional(),
  visitedBefore: z.date().optional(),
  sortBy: z.enum(['name', 'created_at', 'last_visit', 'total_visits']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Profile schemas
export const profileFormSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  birthday: z.date().optional(),
  tags: tagsSchema,
  notes: notesSchema,
  preferences: z.record(z.string(), z.unknown()).default({}),
})

// Event schemas
export const eventFormSchema = z.object({
  title: nameSchema,
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be no more than 1000 characters'),
  date: z.date().min(new Date(), 'Event date must be in the future'),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid start time'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid end time').optional(),
  location: z.string().optional(),
  capacity: z.number().min(1).optional(),
  price: z.number().min(0).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
})

export const eventFiltersSchema = z.object({
  search: z.string().optional(),
  date_from: z.date().optional(),
  date_to: z.date().optional(),
  location: z.string().optional(),
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
  sortBy: z.enum(['date', 'title', 'created_at', 'total_rsvps']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// RSVP schemas
export const rsvpFormSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  status: z.enum(['going', 'interested', 'cancelled']),
})

export const checkInSchema = z.object({
  rsvp_id: z.string().uuid('Invalid RSVP ID'),
  checked_in: z.boolean(),
  notes: notesSchema,
})

// Booking schemas
export const bookingFormSchema = z.object({
  user_id: z.string().uuid().optional(),
  customer_name: z.string().min(1, 'Customer name is required').max(100, 'Customer name must be no more than 100 characters'),
  customer_email: emailSchema.optional(),
  customer_phone: phoneSchema,
  date: z.date().min(new Date(), 'Booking date must be in the future'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time'),
  party_size: z.number().min(VALIDATION_RULES.PARTY_SIZE.MIN).max(VALIDATION_RULES.PARTY_SIZE.MAX),
  notes: notesSchema,
})

export const bookingFiltersSchema = z.object({
  search: z.string().optional(),
  date_from: z.date().optional(),
  date_to: z.date().optional(),
  status: z.array(z.enum(['pending', 'confirmed', 'cancelled', 'completed'])).optional(),
  party_size_min: z.number().min(1).optional(),
  party_size_max: z.number().max(50).optional(),
  time_from: z.string().optional(),
  time_to: z.string().optional(),
  sortBy: z.enum(['date', 'time', 'party_size', 'created_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Inventory schemas
export const inventoryFormSchema = z.object({
  item_name: nameSchema,
  category: z.enum(['drinks', 'supplies', 'food', 'equipment']),
  quantity: z.number().min(VALIDATION_RULES.QUANTITY.MIN).max(VALIDATION_RULES.QUANTITY.MAX),
  threshold: z.number().min(0).max(999999),
  cost: z.number().min(VALIDATION_RULES.COST.MIN).max(VALIDATION_RULES.COST.MAX).optional(),
})

export const inventoryLogFormSchema = z.object({
  item_id: z.string().uuid('Invalid item ID'),
  change: z.number().refine((val) => val !== 0, 'Change must not be zero'),
  reason: z.enum(['purchase', 'usage', 'correction', 'waste']),
  notes: notesSchema,
})

export const inventoryFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.array(z.enum(['drinks', 'supplies', 'food', 'equipment'])).optional(),
  is_low_stock: z.boolean().optional(),
  cost_min: z.number().min(0).optional(),
  cost_max: z.number().min(0).optional(),
  sortBy: z.enum(['item_name', 'quantity', 'cost', 'last_updated']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// File upload schema
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be a valid image (JPEG, PNG, or WebP)'
    ),
})

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.record(z.string(), z.unknown()).optional(),
})

// Export schemas for type inference
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CustomerFormData = z.infer<typeof customerFormSchema>
export type ProfileFormData = z.infer<typeof profileFormSchema>
export type EventFormData = z.infer<typeof eventFormSchema>
export type RSVPFormData = z.infer<typeof rsvpFormSchema>
export type BookingFormData = z.infer<typeof bookingFormSchema>
export type InventoryFormData = z.infer<typeof inventoryFormSchema>
export type InventoryLogFormData = z.infer<typeof inventoryLogFormSchema>
export type PaginationParams = z.infer<typeof paginationSchema>
export type SearchParams = z.infer<typeof searchSchema> 