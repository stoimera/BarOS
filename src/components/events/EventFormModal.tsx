"use client"

import { useState, useEffect } from "react"
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { Event, EventFormData, EventWithDetails } from "@/types/event"
import { toast } from "sonner"
import { supabase } from '@/lib/supabase'
import Image from "next/image"

interface EventFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (event: EventFormData) => Promise<void>
  initialValues?: Event | EventWithDetails | null
  isEditMode?: boolean
}

export function EventFormModal({ open, onClose, onSave, initialValues, isEditMode = false }: EventFormModalProps) {
  const [form, setForm] = useState<EventFormData>({
    title: "",
    description: "",
    date: new Date(),
    start_time: "",
    end_time: "",
    location: "",
    category: "",
    capacity: 0,
    price: 0,
    image_url: ""
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string>("")

  useEffect(() => {
    console.log('EventFormModal useEffect - initialValues:', initialValues)
    console.log('EventFormModal useEffect - isEditMode:', isEditMode)
    
    // Add safety check for initialValues
    if (!initialValues) {
      console.log('No initial values provided, setting default form')
      setForm({
        title: "",
        description: "",
        date: new Date(),
        start_time: "",
        end_time: "",
        location: "",
        category: "",
        capacity: 0,
        price: 0,
        image_url: ""
      })
      setImagePreview("")
      setErrors({})
      return
    }
    
    // Check if initialValues has required properties
    if (initialValues.id && initialValues.title) {
      console.log('Setting form with initial values:', initialValues)
      setForm({
        title: initialValues.title || "",
        description: initialValues.description || "",
        date: initialValues.event_date ? new Date(initialValues.event_date) : new Date(),
        start_time: initialValues.start_time || "",
        end_time: initialValues.end_time || "",
        location: initialValues.location || "",
        category: initialValues.category || "",
        capacity: initialValues.max_capacity || 0,
        price: initialValues.price || 0,
        image_url: ""
      })
      setImagePreview("")
    } else {
      console.log('Initial values missing required properties, setting default form')
      setForm({
        title: "",
        description: "",
        date: new Date(),
        start_time: "",
        end_time: "",
        location: "",
        category: "",
        capacity: 0,
        price: 0,
        image_url: ""
      })
      setImagePreview("")
    }
    setErrors({})
  }, [initialValues, isEditMode])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!form.title.trim()) {
      newErrors.title = "Title is required"
    } else if (form.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters"
    }

    if (!form.description || !form.description.trim()) {
      newErrors.description = "Description is required"
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    if (!form.category || form.category.trim() === "") {
      newErrors.category = "Category is required"
    }

    if (!form.date) {
      newErrors.date = "Date is required"
    } else if (form.date < new Date()) {
      newErrors.date = "Event date cannot be in the past"
    }

    if (!form.start_time) {
      newErrors.start_time = "Start time is required"
    }

    // Validate image URL if provided
    if (form.image_url && !isValidUrl(form.image_url)) {
      newErrors.image_url = "Please enter a valid URL"
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors in the form", {
        description: "Check the highlighted fields below."
      })
      return false
    }
    
    return true
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      await onSave(form)
      // Success notification is handled by the parent component
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while saving the event"
      
      // Show error in toast
      toast.error("Failed to save event", {
        description: errorMessage
      })
      
      // Set form-level error
      setErrors({ form: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleImageFileChange = async (file: File | null) => {
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type', { description: 'Please upload a JPEG, PNG, or WebP image' })
        return
      }
      
      if (file.size > maxSize) {
        toast.error('File too large', { description: 'Image must be less than 5MB' })
        return
      }

      // Show preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `event-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const { error } = await supabase.storage.from('events').upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
        
        if (error) {
          toast.error('Failed to upload image', { description: error.message })
          return
        }
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('events').getPublicUrl(fileName)
        if (publicUrlData?.publicUrl) {
          setForm(prev => ({ ...prev, image_url: publicUrlData.publicUrl }))
          toast.success('Image uploaded successfully')
        }
      } catch {
        toast.error('Failed to upload image', { description: 'Please try again' })
      }
    } else {
      setImagePreview("")
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={isEditMode ? "Edit Event" : "Create New Event"}
      loading={loading}
      submitText={isEditMode ? "Update Event" : "Create Event"}
      size="xl"
    >
      <div className="space-y-6">
        {/* Form-level error */}
        {errors.form && (
          <div className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            <strong>Error:</strong> {errors.form}
          </div>
        )}

        <FormField
          label="Event Title"
          name="title"
          type="text"
          value={form.title}
          onChange={(value: string) => setForm(prev => ({ ...prev, title: value }))}
          placeholder="Enter event title"
          required
          error={errors.title}
          disabled={loading}
        />

        <FormField
          label="Date"
          name="date"
          type="date"
          value={form.date instanceof Date && !isNaN(form.date.getTime()) ? formatDateForInput(form.date).split('T')[0] : ''}
          onChange={(value: string) => {
            const dateValue = new Date(value)
            if (!isNaN(dateValue.getTime())) {
              setForm(prev => ({ ...prev, date: dateValue }))
            }
          }}
          required
          error={errors.date}
          disabled={loading}
          helpText="Select the date for your event"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Start Time"
            name="start_time"
            type="time"
            value={form.start_time}
            onChange={(value: string) => setForm(prev => ({ ...prev, start_time: value }))}
            required
            error={errors.start_time}
            disabled={loading}
            helpText="When the event starts"
          />
          
          <FormField
            label="End Time (Optional)"
            name="end_time"
            type="time"
            value={form.end_time}
            onChange={(value: string) => setForm(prev => ({ ...prev, end_time: value }))}
            error={errors.end_time}
            disabled={loading}
            helpText="When the event ends (optional)"
          />
        </div>

        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={form.description || ""}
          onChange={(value: string) => setForm(prev => ({ ...prev, description: value }))}
          placeholder="Describe your event..."
          rows={4}
          required
          error={errors.description}
          disabled={loading}
        />

        <FormField
          label="Category"
          name="category"
          type="select"
          value={form.category}
          onChange={(value: string) => setForm(prev => ({ ...prev, category: value }))}
          required
          error={errors.category}
          disabled={loading}
          placeholder="Select a category"
          options={[
            { value: "live_music", label: "Live Music" },
            { value: "food_tasting", label: "Food Tasting" },
            { value: "wine_tasting", label: "Wine Tasting" },
            { value: "special_occasion", label: "Special Occasion" }
          ]}
        />

        <div className="space-y-4">
          <FormField
            label="Image URL (Optional)"
            name="image_url"
            type="url"
            value={form.image_url}
            onChange={(value: string) => setForm(prev => ({ ...prev, image_url: value }))}
            placeholder="https://example.com/image.jpg"
            error={errors.image_url}
            disabled={loading}
            helpText="Provide a URL to an image for your event"
          />

          <div className="relative">
            <FormField
              label="Upload Image (Optional)"
              name="image_file"
              type="file"
              onChange={handleImageFileChange}
              disabled={loading}
              helpText="Or upload an image file (JPEG, PNG, WebP up to 5MB)"
            />
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-md">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Uploading...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {imagePreview && (
          <div className="mt-2">
            <Image
              src={imagePreview}
              alt="Event preview"
              width={320}
              height={160}
              unoptimized
              className="max-h-40 rounded border w-auto h-auto"
            />
          </div>
        )}

        <FormField
          label="Location (Optional)"
          name="location"
          type="text"
          value={form.location}
          onChange={(value: string) => setForm(prev => ({ ...prev, location: value }))}
          placeholder="Event location"
          disabled={loading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Capacity (Optional)"
            name="capacity"
            type="number"
            value={form.capacity || ''}
            onChange={(value: string) => setForm(prev => ({ ...prev, capacity: value ? Number(value) : 0 }))}
            placeholder="Max attendees"
            min={1}
            disabled={loading}
          />
          <FormField
            label="Price € (Optional)"
            name="price"
            type="number"
            value={form.price || ''}
            onChange={(value: string) => setForm(prev => ({ ...prev, price: value ? Number(value) : 0 }))}
            placeholder="0.00"
            min={0}
            step={0.01}
            disabled={loading}
          />
        </div>
      </div>
    </FormModal>
  )
} 