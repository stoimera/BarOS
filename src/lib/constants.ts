// Application constants and configuration

// Application routes for navigation and routing
export const ROUTES = {
  // Public routes accessible without authentication
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Dashboard routes requiring authentication
  DASHBOARD: '/dashboard',
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: (id: string) => `/customers/${id}`,
  EVENTS: '/events',
  EVENT_DETAIL: (id: string) => `/events/${id}`,
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (id: string) => `/bookings/${id}`,
  INVENTORY: '/inventory',
  INVENTORY_DETAIL: (id: string) => `/inventory/${id}`,
  PROFILE: '/profile',
  
  // Customer portal routes for customer-facing features
  CUSTOMER_PORTAL: '/customer',
  CUSTOMER_EVENTS: '/customer/events',
  CUSTOMER_BOOKINGS: '/customer/bookings',
  CUSTOMER_LOYALTY: '/customer/loyalty',
}

// API endpoint definitions for backend communication
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  
  // Customer management endpoints
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    DETAIL: (id: string) => `/customers/${id}`,
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
    IMPORT: '/customers/import',
    EXPORT: '/customers/export',
    STATS: '/customers/stats',
  },
  
  // Event management endpoints
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    DETAIL: (id: string) => `/events/${id}`,
    UPDATE: (id: string) => `/events/${id}`,
    DELETE: (id: string) => `/events/${id}`,
    RSVPS: (id: string) => `/events/${id}/rsvps`,
    CHECK_IN: (id: string) => `/events/${id}/check-in`,
    STATS: '/events/stats',
  },
  
  // Booking management endpoints
  BOOKINGS: {
    LIST: '/bookings',
    CREATE: '/bookings',
    DETAIL: (id: string) => `/bookings/${id}`,
    UPDATE: (id: string) => `/bookings/${id}`,
    DELETE: (id: string) => `/bookings/${id}`,
    CONFIRM: (id: string) => `/bookings/${id}/confirm`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    AVAILABILITY: '/bookings/availability',
    STATS: '/bookings/stats',
  },
  
  // Inventory management endpoints
  INVENTORY: {
    LIST: '/inventory',
    CREATE: '/inventory',
    DETAIL: (id: string) => `/inventory/${id}`,
    UPDATE: (id: string) => `/inventory/${id}`,
    DELETE: (id: string) => `/inventory/${id}`,
    LOGS: (id: string) => `/inventory/${id}/logs`,
    ADD_LOG: (id: string) => `/inventory/${id}/logs`,
    ALERTS: '/inventory/alerts',
    STATS: '/inventory/stats',
  },
  
  // User profile management endpoints
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
    PREFERENCES: '/profile/preferences',
  },
} as const

// Navigation menu items for sidebar and header
export const NAVIGATION_ITEMS = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: 'LayoutDashboard',
  },
  {
    label: 'Customers',
    href: ROUTES.CUSTOMERS,
    icon: 'Users',
  },
  {
    label: 'Events',
    href: ROUTES.EVENTS,
    icon: 'Calendar',
  },
  {
    label: 'Bookings',
    href: ROUTES.BOOKINGS,
    icon: 'Clock',
  },
  {
    label: 'Inventory',
    href: ROUTES.INVENTORY,
    icon: 'Package',
  },
  {
    label: 'Profile',
    href: ROUTES.PROFILE,
    icon: 'User',
  },
] as const

// Booking status options for filtering and display
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
] as const

// RSVP status options for event responses
export const RSVP_STATUS_OPTIONS = [
  { value: 'going', label: 'Going' },
  { value: 'interested', label: 'Interested' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

// Inventory item categories for organization
export const INVENTORY_CATEGORIES = [
  { value: 'drinks', label: 'Drinks' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'food', label: 'Food' },
  { value: 'equipment', label: 'Equipment' },
] as const

// Inventory adjustment reasons for tracking changes
export const INVENTORY_REASONS = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'usage', label: 'Usage' },
  { value: 'correction', label: 'Correction' },
  { value: 'waste', label: 'Waste' },
] as const

// Available time slots for booking appointments
export const TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
  '23:00', '23:30',
] as const

// Party size options for booking capacity
export const PARTY_SIZE_OPTIONS = [
  { value: 1, label: '1 person' },
  { value: 2, label: '2 people' },
  { value: 3, label: '3 people' },
  { value: 4, label: '4 people' },
  { value: 5, label: '5 people' },
  { value: 6, label: '6 people' },
  { value: 7, label: '7 people' },
  { value: 8, label: '8 people' },
  { value: 9, label: '9 people' },
  { value: 10, label: '10 people' },
  { value: 11, label: '11 people' },
  { value: 12, label: '12 people' },
  { value: 13, label: '13 people' },
  { value: 14, label: '14 people' },
  { value: 15, label: '15 people' },
  { value: 16, label: '16 people' },
  { value: 17, label: '17 people' },
  { value: 18, label: '18 people' },
  { value: 19, label: '19 people' },
  { value: 20, label: '20 people' },
] as const

// Pagination configuration for data tables
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
} as const

// Date and time format configurations
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_TIME: 'Please enter a valid time',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be no more than ${max}`,
  NETWORK_ERROR: 'Network error. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created',
  UPDATED: 'Successfully updated',
  DELETED: 'Successfully deleted',
  SAVED: 'Successfully saved',
  SENT: 'Successfully sent',
} as const

// Validation rules
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  PHONE: {
    MAX_LENGTH: 20,
  },
  NOTES: {
    MAX_LENGTH: 1000,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  PARTY_SIZE: {
    MIN: 1,
    MAX: 50,
  },
  QUANTITY: {
    MIN: 0,
    MAX: 999999,
  },
  COST: {
    MIN: 0,
    MAX: 999999.99,
  },
} as const

// Theme colors
export const THEME_COLORS = {
  PRIMARY: 'hsl(var(--primary))',
  SECONDARY: 'hsl(var(--secondary))',
  SUCCESS: 'hsl(var(--success))',
  WARNING: 'hsl(var(--warning))',
  DESTRUCTIVE: 'hsl(var(--destructive))',
  MUTED: 'hsl(var(--muted))',
} as const

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const

// Business Information
export const BUSINESS_INFO = {
  name: "Your Bar Name",
  googlePlaceId: "YOUR_GOOGLE_PLACE_ID", // Replace with actual Google Place ID
  googleReviewUrl: "https://www.google.com/maps/place/?q=place_id:YOUR_GOOGLE_PLACE_ID",
  website: "https://yourbar.com",
  phone: "+1234567890"
}

// Referral Program Configuration
export const REFERRAL_CONFIG = {
  referralsNeededForReward: 3,
  rewardDescription: "Free drink of your choice",
  rewardValue: 15, // Estimated value in currency
  rewardExpiryDays: 30
}

// Feedback Configuration
export const FEEDBACK_CONFIG = {
  autoPromptAfterBooking: true,
  autoPromptAfterEvent: true,
  promptDelayMinutes: 60, // Delay before showing feedback prompt
  reminderDays: 3 // Send reminder after X days if no feedback
} 