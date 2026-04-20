"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchCustomerById, addCustomerVisit, markLoyaltyRewarded, getCustomerLoyaltyRewards, deleteCustomer, updateCustomer } from "@/lib/customers"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Phone, 
  Mail, 
  User
} from "lucide-react"
import { Customer, LoyaltyReward, LoyaltyTier } from "@/types/customer"
import { ErrorAlert } from "@/components/ui/loading-states"
import { Skeleton } from "@/components/ui/skeleton"
import { LoyaltyCard } from "@/components/customers/LoyaltyCard"
import { LoyaltyRewards } from "@/components/customers/LoyaltyRewards"
import { CustomerDeleteDialog } from "@/components/customers/CustomerDeleteDialog"
import { CustomerFormModal } from "@/components/customers/CustomerFormModal"
import { toast } from "sonner"
import { formatDateGB } from '@/utils/dateUtils'

const supabase = createClient()

interface LoyaltyData {
  id: string
  customer_id: string
  punch_count: number
  goal: number
  tier: LoyaltyTier
  total_points: number
  lifetime_visits: number
  last_visit?: Date
  rewarded: boolean
  created_at: Date
  updated_at: Date
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  const loadCustomer = useCallback(async () => {
    if (!params.id || params.id === 'new') return
    
    try {
      setLoading(true)
      setError("")
      
      console.log('CustomerDetailPage: Loading customer with ID:', params.id);
      
      // Fetch customer data with loyalty details
      const customerData = await fetchCustomerById(params.id as string)
      console.log('CustomerDetailPage: Customer data loaded:', customerData);
      setCustomer(customerData)
      
      // Fetch loyalty data directly using customer_id
      let loyalty = null
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty')
        .select('*')
        .eq('customer_id', customerData.id)
        .single()
      
      if (loyaltyError) {
        console.warn('CustomerDetailPage: No loyalty data found for customer:', loyaltyError);
      } else {
        loyalty = loyaltyData
      }
      
      setLoyaltyData(loyalty)
      
      // Fetch loyalty rewards
      const rewardsData = await getCustomerLoyaltyRewards(params.id as string)
      setRewards(rewardsData)
      
    } catch (err) {
      console.error('CustomerDetailPage: Error loading customer:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load customer"
      setError(errorMessage)
      toast.error("Failed to load customer", { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadCustomer()
  }, [loadCustomer])

  const handleEdit = () => {
    console.log('Edit button clicked, customer:', customer);
    setEditingCustomer(customer)
    setEditModalOpen(true)
    console.log('Edit modal state set to true');
  }

  const handleDelete = () => {
    console.log('Delete button clicked, customer:', customer);
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
    console.log('Delete dialog state set to true');
  }

  const handleSave = async (form: Partial<Customer>) => {
    if (!customer) return;
    
    try {
      await updateCustomer(customer.id, form)
      toast.success('Customer updated successfully')
      await loadCustomer() // Reload customer data
      setEditModalOpen(false)
      setEditingCustomer(null)
    } catch {
      toast.error('Failed to update customer')
    }
  }

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await deleteCustomer(customerToDelete.id);
      router.push('/customers');
    } catch (error) {
      // Error handling is already done in the mutation
      console.error('Delete error:', error);
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  }

  const handleAddVisit = async () => {
    if (!customer) return
    
    try {
      await addCustomerVisit(customer.id)
      toast.success("Visit added successfully!")
      
      // Force refresh of loyalty data specifically using customer_id
      console.log('Refreshing loyalty data for customer_id:', customer.id)
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty')
        .select('*')
        .eq('customer_id', customer.id)
        .single()
      
      if (!loyaltyError && loyaltyData) {
        console.log('Updated loyalty data:', loyaltyData)
        setLoyaltyData(loyaltyData)
      } else {
        console.warn('Failed to refresh loyalty data:', loyaltyError)
      }
      
      // Also reload the full customer data
      await loadCustomer()
    } catch (error) {
      toast.error("Failed to add visit", { description: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const handleMarkRewarded = async () => {
    if (!customer || !loyaltyData) return
    
    try {
      await markLoyaltyRewarded(customer.id)
      toast.success("Loyalty card marked as rewarded!")
      await loadCustomer() // Reload data to update loyalty
    } catch (error) {
      toast.error("Failed to mark as rewarded", { description: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const handleRewardClaimed = async () => {
    await loadCustomer() // Reload rewards data
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Skeleton className="h-48 sm:h-64" />
            <Skeleton className="h-24 sm:h-32" />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-40 sm:h-48" />
            <Skeleton className="h-24 sm:h-32" />
          </div>
        </div>
    </div>
  )
}

  if (error) {
    return (
      <ErrorAlert 
        title="Failed to load customer"
        message={error}
        onRetry={loadCustomer}
      />
    )
  }

  if (!customer) {
    return (
      <ErrorAlert 
        title="Customer not found"
        message="The customer you're looking for doesn't exist."
        onRetry={() => router.push('/customers')}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Button variant="ghost" onClick={() => router.push('/customers')} className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Customers</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="min-w-0 flex-1 sm:flex-none">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{customer.name}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Customer Details</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <Button variant="outline" onClick={handleEdit} className="flex-1 sm:flex-none">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete} className="flex-1 sm:flex-none">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <a 
                      href={`mailto:${customer.email}`} 
                      className="text-blue-600 hover:underline break-all"
                    >
                      {customer.email}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <a 
                      href={`tel:${customer.phone}`} 
                      className="text-blue-600 hover:underline break-all"
                    >
                      {customer.phone || 'No phone number'}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDateGB(new Date(customer.created_at))}</span>
                  </div>
                </div>
              </div>

              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs sm:text-sm">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {customer.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-md break-words">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty Rewards */}
          <LoyaltyRewards 
            rewards={rewards}
            onRewardClaimed={handleRewardClaimed}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Loyalty Card */}
          {loyaltyData && (
            <LoyaltyCard
              punchCount={loyaltyData.punch_count || 0}
              goal={loyaltyData.goal || 10}
              rewarded={loyaltyData.rewarded || false}
              tier={loyaltyData.tier || 'bronze'}
              totalPoints={loyaltyData.total_points || 0}
              lifetimeVisits={loyaltyData.lifetime_visits || 0}
              onAddVisit={handleAddVisit}
              onMarkRewarded={handleMarkRewarded}
            />
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base sm:text-lg">Quick Stats</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadCustomer}
                  className="h-6 w-6 p-0"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Visits</span>
                <span className="font-medium text-sm sm:text-base">{loyaltyData?.lifetime_visits || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Visit</span>
                <span className="font-medium text-sm sm:text-base">
                  {loyaltyData?.last_visit 
                    ? formatDateGB(new Date(loyaltyData.last_visit))
                    : 'Never'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Points</span>
                <span className="font-medium text-sm sm:text-base">{loyaltyData?.total_points || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Rewards</span>
                <span className="font-medium text-sm sm:text-base">
                  {rewards.filter(r => !r.claimed && (!r.expires_at || new Date(r.expires_at) > new Date())).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit Modal */}
      <CustomerFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingCustomer(null)
        }}
        onSave={handleSave}
        initialValues={editingCustomer}
      />
      
      {/* Delete Dialog */}
      <CustomerDeleteDialog
        customer={customerToDelete}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
} 