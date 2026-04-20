"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEventTemplates } from '@/hooks/useEventTemplates'
import { EventTemplate } from '@/types/event'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert, StatsSkeleton, TableSkeleton } from '@/components/ui/loading-states'
import { Plus, Search, Edit, Trash2, Calendar, Play, Eye } from 'lucide-react'
import { getRecurrenceDescription } from '@/lib/eventTemplates'
import { EventGenerationModal } from '@/components/events/EventGenerationModal'
import { EventTemplateDeleteDialog } from '@/components/events/EventTemplateDeleteDialog'

export default function EventTemplatesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)
  const [generatingTemplateId, setGeneratingTemplateId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<EventTemplate | null>(null)
  const [generationModalOpen, setGenerationModalOpen] = useState(false)
  const [templateToGenerate, setTemplateToGenerate] = useState<EventTemplate | null>(null)

  // Use React Query hook for event templates
  const {
    templates,
    isLoading,
    error,
    deleteTemplate,
    generateEvents,
    isDeleting,
    isGenerating
  } = useEventTemplates({
    search
  })

  const handleDelete = async (template: EventTemplate) => {
    setTemplateToDelete(template)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    setDeletingTemplateId(templateToDelete.id)
    try {
      await deleteTemplate(templateToDelete.id)
      setDeleteModalOpen(false)
      setTemplateToDelete(null)
    } catch {
      // Error handling is already done in the mutation
    } finally {
      setDeletingTemplateId(null)
    }
  }

  const handleGenerateEvents = async (template: EventTemplate) => {
    setTemplateToGenerate(template)
    setGenerationModalOpen(true)
  }

  const confirmGenerateEvents = async (data: { numberOfEvents: number; startDate: Date }) => {
    if (!templateToGenerate) return

    setGeneratingTemplateId(templateToGenerate.id)
    try {
      await generateEvents({
        templateId: templateToGenerate.id,
        startDate: data.startDate,
        numberOfEvents: data.numberOfEvents
      })
      router.push('/events')
    } catch {
      // Error handling is already done in the mutation
    } finally {
      setGeneratingTemplateId(null)
    }
  }

  const stats = {
    total: templates.length,
    active: templates.length, // All templates are considered active in new structure
    weekly: templates.filter(t => t.recurring_options.frequency === 'weekly').length,
    monthly: templates.filter(t => t.recurring_options.frequency === 'monthly').length
  }

  if (isLoading && templates.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Skeleton */}
        <StatsSkeleton />

        {/* Content Skeleton */}
        <Card className="">
          <CardContent className="p-4">
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Event Templates</h1>
            <p className="text-muted-foreground">Manage your event templates</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load event templates"
          message={error.message}
          onRetry={() => {}}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Event Templates</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Create and manage reusable event templates</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => router.push('/event-templates/new')} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.weekly}</div>
            <p className="text-xs text-muted-foreground">
              weekly templates
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.monthly}</div>
            <p className="text-xs text-muted-foreground">
              monthly templates
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              events this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10  focus-visible:ring-primary focus-visible:ring-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card className="">
        <CardHeader>
          <CardTitle>Event Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No event templates found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first event template.</p>
              <Button onClick={() => router.push('/event-templates/new')} className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{template.category}</p>
                      <p className="text-muted-foreground">
                        {getRecurrenceDescription(template)}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{template.default_capacity} capacity</p>
                      <p className="text-muted-foreground">€{template.default_price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/event-templates/${template.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/event-templates/${template.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGenerateEvents(template)}
                      disabled={generatingTemplateId === template.id}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(template)}
                      disabled={deletingTemplateId === template.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Generation Modal */}
      <EventGenerationModal
        template={templateToGenerate}
        open={generationModalOpen}
        onClose={() => {
          setGenerationModalOpen(false)
          setTemplateToGenerate(null)
        }}
        onGenerate={confirmGenerateEvents}
        loading={isGenerating}
      />

      {/* Delete Confirmation Dialog */}
      <EventTemplateDeleteDialog
        template={templateToDelete}
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setTemplateToDelete(null)
        }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
} 