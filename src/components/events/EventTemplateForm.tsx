"use client"

import { useState, useEffect } from "react"
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EventTemplate, CreateEventTemplateData, UpdateEventTemplateData } from "@/types/event"
import { validateTemplateData } from "@/lib/eventTemplates"
import { toast } from "sonner"
import { supabase } from '@/lib/supabase'
import Image from "next/image"

interface EventTemplateFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateEventTemplateData | UpdateEventTemplateData) => Promise<void>
  template?: EventTemplate
  loading?: boolean
}

export function EventTemplateForm({ 
  open, 
  onClose, 
  onSubmit, 
  template, 
  loading = false 
}: EventTemplateFormProps) {
  const [formData, setFormData] = useState<CreateEventTemplateData>({
    name: "",
    description: "",
    category: "general",
    default_duration: 2,
    default_capacity: 50,
    default_price: 0,
    suggested_location: "",
    recommended_marketing_channels: ["email", "social_media"],
    checklist_items: [],
    recurring_options: {
      frequency: "weekly",
      best_days: [0],
      best_times: ["19:00"],
      seasonal_factors: []
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        default_duration: template.default_duration,
        default_capacity: template.default_capacity,
        default_price: template.default_price,
        suggested_location: template.suggested_location,
        recommended_marketing_channels: template.recommended_marketing_channels,
        checklist_items: template.checklist_items,
        recurring_options: template.recurring_options
      })
    } else {
      setFormData({
        name: "",
        description: "",
        category: "general",
        default_duration: 2,
        default_capacity: 50,
        default_price: 0,
        suggested_location: "",
        recommended_marketing_channels: ["email", "social_media"],
        checklist_items: [],
        recurring_options: {
          frequency: "weekly",
          best_days: [0],
          best_times: ["19:00"],
          seasonal_factors: []
        }
      })
    }
    setErrors({})
    setImagePreview("")
  }, [template, open])

  const handleSubmit = async () => {
    const validationErrors = validateTemplateData(formData)
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {}
      validationErrors.forEach(error => {
        if (error.includes('name')) errorMap.name = error
        else if (error.includes('description')) errorMap.description = error
        else if (error.includes('duration')) errorMap.default_duration = error
      })
      setErrors(errorMap)
      return
    }

    try {
      const submitData = template 
        ? { ...formData } as UpdateEventTemplateData
        : { ...formData } as CreateEventTemplateData
      
      await onSubmit(submitData)
      onClose()
    } catch {
      toast.error("Failed to save template")
    }
  }

  const updateRecurringOptions = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurring_options: {
        ...prev.recurring_options,
        [key]: value
      }
    }))
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const frequencyOptions = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" }
  ]

  const dayOptions = dayNames.map((day, index) => ({
    value: index.toString(),
    label: day
  }))

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

      setUploading(true)
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `template-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const { error } = await supabase.storage.from('event-templates').upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
        
        if (error) {
          toast.error('Failed to upload image', { description: error.message })
          return
        }
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('event-templates').getPublicUrl(fileName)
        if (publicUrlData?.publicUrl) {
          // Note: You'll need to add image_url field to your event template data structure
          // setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }))
          toast.success('Image uploaded successfully')
        }
      } catch {
        toast.error('Failed to upload image', { description: 'Please try again' })
      } finally {
        setUploading(false)
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
      title={template ? 'Edit Event Template' : 'Create Event Template'}
      loading={loading}
      submitText={template ? "Update Template" : "Create Template"}
      size="xl"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="Template Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(value: string) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="e.g., Weekly Trivia Night"
              required
              error={errors.name}
              disabled={loading}
            />

            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={(value: string) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe the event template..."
              rows={3}
              required
              error={errors.description}
              disabled={loading}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Category"
                name="category"
                type="text"
                value={formData.category}
                onChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
                placeholder="e.g., Entertainment, Food, Sports"
                disabled={loading}
              />
              <FormField
                label="Default Duration (hours)"
                name="duration"
                type="number"
                value={formData.default_duration}
                onChange={(value: string) => setFormData(prev => ({ ...prev, default_duration: Number(value) }))}
                min={0.5}
                step={0.5}
                required
                error={errors.default_duration}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Default Capacity"
                name="capacity"
                type="number"
                value={formData.default_capacity}
                onChange={(value: string) => setFormData(prev => ({ ...prev, default_capacity: Number(value) }))}
                min={1}
                placeholder="Max attendees"
                disabled={loading}
              />
              <FormField
                label="Default Price (€)"
                name="price"
                type="number"
                value={formData.default_price}
                onChange={(value: string) => setFormData(prev => ({ ...prev, default_price: Number(value) }))}
                min={0}
                step={0.01}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <FormField
              label="Suggested Location"
              name="location"
              type="text"
              value={formData.suggested_location}
              onChange={(value: string) => setFormData(prev => ({ ...prev, suggested_location: value }))}
              placeholder="Suggested event location"
              disabled={loading}
            />

            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="relative">
                <FormField
                  label="Template Image (Optional)"
                  name="template_image"
                  type="file"
                  onChange={handleImageFileChange}
                  disabled={loading || uploading}
                  helpText="Upload an image for this template (JPEG, PNG, WebP up to 5MB)"
                  inputClassName="border-border focus:border-primary focus:ring-primary hover:border-border file:border-border file:focus:border-primary file:hover:border-border"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-md">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading...</span>
                    </div>
                  </div>
                )}
              </div>

              {imagePreview && (
                <div className="mt-2">
                  <Image
                    src={imagePreview}
                    alt="Template preview"
                    width={320}
                    height={160}
                    unoptimized
                    className="max-h-40 rounded border border-border w-auto h-auto"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recurrence Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recurrence Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="Recurrence Frequency"
              name="frequency"
              type="select"
              value={formData.recurring_options.frequency}
              onChange={(value: string) => updateRecurringOptions('frequency', value)}
              options={frequencyOptions}
              required
              disabled={loading}
            />

            {formData.recurring_options.frequency === 'weekly' && (
              <FormField
                label="Day of Week"
                name="day_of_week"
                type="select"
                value={formData.recurring_options.best_days[0]?.toString() || '0'}
                onChange={(value: string) => updateRecurringOptions('best_days', [Number(value)])}
                options={dayOptions}
                disabled={loading}
              />
            )}

            <FormField
              label="Best Time"
              name="best_time"
              type="time"
              value={formData.recurring_options.best_times[0] || '19:00'}
              onChange={(value: string) => updateRecurringOptions('best_times', [value])}
              disabled={loading}
            />
          </CardContent>
        </Card>
      </div>
    </FormModal>
  )
} 