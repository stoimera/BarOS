"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchCustomersWithDetails } from "@/lib/customers";
import { CustomerWithDetails } from "@/types/customer";
import { toast } from "sonner";
import { handleComponentError } from '@/utils/error-handling';
import { Skeleton } from "@/components/ui/skeleton";
import { api } from '@/lib/api/client';

interface CampaignModalProps {
  open: boolean;
  onClose: () => void;
}

export function CampaignModal({ open, onClose }: CampaignModalProps) {
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await fetchCustomersWithDetails({ page: 1, limit: 100 });
      setCustomers(result.data.filter(c => c.email)); // Only customers with emails
    } catch (error) {
      handleComponentError(error, 'load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSendCampaign = async () => {
    if (!subject.trim() || !message.trim() || selectedCustomers.length === 0) {
      toast.error("Please fill in all fields and select at least one customer");
      return;
    }

    setSending(true);
    try {
      const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));
      const result = await api.post<{ success: number; failed: number; error?: string }>(
        'marketing/send-campaign',
        {
          customers: selectedCustomerData.map(c => ({ name: c.name, email: c.email! })),
          subject,
          message,
          businessName: "Your Bar"
        }
      );
      toast.success(`Campaign sent! ${result.data.success} successful, ${result.data.failed} failed`);
      onClose();
      // Reset form
      setSubject("");
      setMessage("");
      setSelectedCustomers([]);
    } catch (error) {
      handleComponentError(error, 'send campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSendCampaign}
      title="Send Marketing Campaign"
      loading={sending}
      submitText="Send Campaign"
      size="full"
      disableSubmit={selectedCustomers.length === 0 || !subject.trim() || !message.trim()}
    >
      <div className="space-y-6">
        {/* Campaign Details */}
        <div className="space-y-4">
          <FormField
            label="Subject"
            name="subject"
            type="text"
            value={subject}
            onChange={(value: string) => setSubject(value)}
            placeholder="Enter email subject..."
            disabled={sending}
          />
          
          <FormField
            label="Message"
            name="message"
            type="textarea"
            value={message}
            onChange={(value: string) => setMessage(value)}
            placeholder="Enter your message..."
            rows={6}
            disabled={sending}
          />
        </div>

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">👥</span>
                <span className="text-sm sm:text-base">Select Recipients ({selectedCustomers.length} selected)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="w-full sm:w-auto"
              >
                {selectedCustomers.length === filteredCustomers.length ? "Deselect All" : "Select All"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <FormField
                label=""
                name="search"
                type="text"
                value={searchTerm}
                onChange={(value: string) => setSearchTerm(value)}
                placeholder="Search customers..."
                disabled={sending}
              />
            </div>

            {/* Customer List */}
            {loading ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={() => handleSelectCustomer(customer.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs sm:text-sm flex-shrink-0">
                      {customer.total_visits || 0} visits
                    </Badge>
                  </div>
                ))}
                
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-3xl mx-auto text-gray-300 mb-2 block">👥</span>
                    <p>No customers found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Preview */}
        {subject && message && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>Subject:</strong> {subject}
                </div>
                <div>
                  <strong>Recipients:</strong> {selectedCustomers.length} customers
                </div>
                <div>
                  <strong>Message:</strong>
                  <div className="mt-2 p-3 bg-muted rounded border whitespace-pre-wrap text-sm">
                    {message}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FormModal>
  );
} 