"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/forms/FormModal";
import { FormField } from "@/components/forms/FormField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  VisitType, 
  VisitCheckIn,
  VisitWithDetails 
} from "@/types/visit";
import { CustomerWithDetails } from "@/types/customer";
import { checkInCustomer, getVisits } from "@/lib/visits";
import { fetchCustomersWithDetails } from "@/lib/customers";
import { toast } from "sonner";
import { format } from "date-fns";

interface VisitCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  onSuccess?: () => void;
}

export function VisitCheckInModal({ 
  open, 
  onOpenChange, 
  staffId,
  onSuccess
}: VisitCheckInModalProps) {
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [visitType, setVisitType] = useState<VisitType>("regular");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerVisits, setCustomerVisits] = useState<VisitWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerVisits(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      const customersData = await fetchCustomersWithDetails({ page: 1, limit: 100 });
      setCustomers(customersData.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadCustomerVisits = async (customerId: string) => {
    try {
      const visits = await getVisits({ 
        customer_id: customerId,
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
      });
      setCustomerVisits(visits);
    } catch (error) {
      console.error('Error loading customer visits:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    customer.phone?.includes(searchTerm)
  );

  const handleCustomerSelect = (customer: CustomerWithDetails) => {
    setSelectedCustomer(customer);
    setActiveTab("checkin");
  };

  const handleCheckIn = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    try {
      const checkInData: VisitCheckIn = {
        customer_id: selectedCustomer.id,
        staff_id: staffId,
        visit_type: visitType,
        notes: notes.trim() || undefined
      };

      await checkInCustomer(checkInData);
      
      toast.success(`Successfully checked in ${selectedCustomer.name}`);
      
      // Reset form
      setSelectedCustomer(null);
      setVisitType("regular");
      setNotes("");
      setActiveTab("search");
      setSearchTerm("");
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error checking in customer:', error);
      toast.error('Failed to check in customer');
    } finally {
      setLoading(false);
    }
  };

  const visitTypeOptions = [
    { value: "regular", label: "Regular Visit" },
    { value: "event", label: "Event" },
    { value: "special", label: "Special Occasion" },
    { value: "birthday", label: "Birthday" },
    { value: "vip", label: "VIP" },
    { value: "alcoholic", label: "Alcoholic Visit" },
    { value: "non_alcoholic", label: "Non-Alcoholic Visit" }
  ];

  const getVisitTypeColor = (type: VisitType) => {
    switch (type) {
      case "regular": return "bg-muted text-foreground";
      case "event": return "bg-purple-100 text-purple-800";
      case "special": return "bg-muted text-foreground";
      case "birthday": return "bg-pink-100 text-pink-800";
      case "vip": return "bg-muted text-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleCheckIn}
      title="Customer Check-In"
      loading={loading}
      submitText="Check In Customer"
      disableSubmit={!selectedCustomer}
      size="lg"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Customer</TabsTrigger>
          <TabsTrigger value="checkin" disabled={!selectedCustomer}>
            Check In
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="space-y-4">
            <FormField
              label="Search Customers"
              name="search"
              type="text"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, email, or phone..."
            />

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredCustomers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-primary text-sm font-medium">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium">{customer.name}</h4>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                          {customer.phone && (
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {customer.loyalty?.tier || 'Bronze'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {customer.loyalty?.lifetime_visits || 0} visits
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checkin" className="space-y-4">
          {selectedCustomer && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    Selected Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{selectedCustomer.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                      {selectedCustomer.phone && (
                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {selectedCustomer.loyalty?.tier || 'Bronze'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedCustomer.loyalty?.lifetime_visits || 0} total visits
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <FormField
                  label="Visit Type"
                  name="visit_type"
                  type="select"
                  value={visitType}
                  onChange={(value: string) => setVisitType(value as VisitType)}
                  options={visitTypeOptions}
                  required
                />

                <FormField
                  label="Notes (Optional)"
                  name="notes"
                  type="textarea"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Any special notes about this visit..."
                  rows={3}
                />

                {/* Recent Visits */}
                <div className="space-y-2">
                  <h4 className="font-medium">
                    Recent Visits
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {customerVisits.slice(0, 5).map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <span>{format(new Date(visit.visit_date), 'MMM d, yyyy')}</span>
                          <Badge className={`text-xs ${getVisitTypeColor(visit.visit_type)}`}>
                            {visit.visit_type}
                          </Badge>
                        </div>
                        {visit.check_in_time && (
                          <span className="text-muted-foreground">
                            {format(new Date(visit.check_in_time), 'HH:mm')}
                          </span>
                        )}
                      </div>
                    ))}
                    {customerVisits.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No recent visits</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </FormModal>
  );
} 