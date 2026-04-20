"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlusCircleIcon, Mail, ImageIcon, BarChart2, FileText, Send, Trash2, Edit, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { 
  getCampaigns, 
  createCampaign, 
  updateCampaign, 
  deleteCampaign,
  getNewsletters,
  createNewsletter,
  updateNewsletter,
  sendNewsletter,
  deleteNewsletter,
  getPromotionalMaterials,
  uploadPromotionalMaterial,
  deletePromotionalMaterial,
  getMarketingOverview
} from "@/lib/marketing";
import { 
  MarketingCampaign, 
  Newsletter, 
  PromotionalMaterial,
  CreateCampaignData,
  CreateNewsletterData
} from "@/types/marketing";
import { toast } from "sonner";
import { FormModal } from "@/components/shared/FormModal";
import { FormField } from "@/components/shared/FormField";
import NextImage from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  CardGridSkeleton
} from "@/components/ui/loading-states";
import { CampaignDeleteDialog } from '@/components/marketing/CampaignDeleteDialog'
import { PromoMaterialDeleteDialog } from '@/components/marketing/PromoMaterialDeleteDialog'
import { NewsletterDeleteDialog } from '@/components/marketing/NewsletterDeleteDialog'
import { NewsletterSendDialog } from '@/components/marketing/NewsletterSendDialog'

const CAMPAIGN_TYPES = ["email", "social", "sms", "promotion"] as const;
const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed"] as const;

export default function MarketingPage() {
  // Campaigns state
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [campaignForm, setCampaignForm] = useState<CreateCampaignData>({ 
    name: "", 
    description: "",
    campaign_type: "email", 
    status: "draft" 
  });
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState<{[key: string]: boolean}>({});
  const [imageError, setImageError] = useState<{[key: string]: boolean}>({});

  // Campaign delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<MarketingCampaign | null>(null);

  // Promotional materials delete modal state
  const [promoDeleteModalOpen, setPromoDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<PromotionalMaterial | null>(null);

  // Newsletter state
  const [newsletterDialogOpen, setNewsletterDialogOpen] = useState(false);
  const [newsletterForm, setNewsletterForm] = useState<CreateNewsletterData>({ 
    name: "", 
    subject: "",
    content: "", 
    status: "draft" 
  });
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);

  // Newsletter modal state
  const [newsletterDeleteModalOpen, setNewsletterDeleteModalOpen] = useState(false);
  const [newsletterToDelete, setNewsletterToDelete] = useState<Newsletter | null>(null);
  const [newsletterSendModalOpen, setNewsletterSendModalOpen] = useState(false);
  const [newsletterToSend, setNewsletterToSend] = useState<Newsletter | null>(null);
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);

  // Promo material state
  const [files, setFiles] = useState<PromotionalMaterial[]>([]);
  const [fileUploading, setFileUploading] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<{
    totalCampaigns: number;
    totalNewsletters: number;
    totalMaterials: number;
    averageOpenRate: number;
    averageClickRate: number;
  }>({
    totalCampaigns: 0,
    totalNewsletters: 0,
    totalMaterials: 0,
    averageOpenRate: 0,
    averageClickRate: 0
  });

  const handleCampaignFormChange = useCallback((field: string, value: string) => {
    setCampaignForm((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleNewsletterFormChange = useCallback((field: string, value: string) => {
    setNewsletterForm((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [campaignsData, newslettersData, filesData, analyticsData] = await Promise.all([
        getCampaigns(),
        getNewsletters(),
        getPromotionalMaterials(),
        getMarketingOverview()
      ]);
      
      setCampaigns(campaignsData);
      setNewsletters(newslettersData);
      setFiles(filesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  }

  function openAddCampaign() {
    setEditingCampaign(null);
    setCampaignForm({ name: "", description: "", campaign_type: "email", status: "draft" });
    setCampaignDialogOpen(true);
  }

  function openEditCampaign(campaign: MarketingCampaign) {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      description: campaign.description,
      campaign_type: campaign.campaign_type,
      status: campaign.status,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      budget: campaign.budget
    });
    setCampaignDialogOpen(true);
  }

  function closeCampaignDialog() {
    setCampaignDialogOpen(false);
    setEditingCampaign(null);
    setCampaignForm({ name: "", description: "", campaign_type: "email", status: "draft" });
  }

  async function handleCampaignSave() {
    try {
      setCampaignSaving(true);
      
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, campaignForm);
        toast.success('Campaign updated successfully');
      } else {
        await createCampaign(campaignForm);
        toast.success('Campaign created successfully');
      }
      
      closeCampaignDialog();
      loadData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setCampaignSaving(false);
    }
  }

  async function handleCampaignDelete(campaign: MarketingCampaign) {
    setCampaignToDelete(campaign);
    setDeleteModalOpen(true);
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCampaignToDelete(null);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    try {
      await deleteCampaign(campaignToDelete.id);
      toast.success('Campaign deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  function openNewsletter() {
    setEditingNewsletter(null);
    setNewsletterForm({ name: "", subject: "", content: "", status: "draft" });
    setNewsletterDialogOpen(true);
  }

  async function handleSendNewsletter() {
    try {
      setSendingNewsletter(true);
      
      if (editingNewsletter) {
        await updateNewsletter(editingNewsletter.id, newsletterForm);
        toast.success('Newsletter updated successfully');
      } else {
        await createNewsletter(newsletterForm);
        toast.success('Newsletter created successfully');
      }
      
      setNewsletterDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error('Failed to save newsletter');
    } finally {
      setSendingNewsletter(false);
    }
  }

  // Newsletter action functions
  function openEditNewsletter(newsletter: Newsletter) {
    setEditingNewsletter(newsletter);
    setNewsletterForm({
      name: newsletter.name,
      subject: newsletter.subject,
      content: newsletter.content,
      status: newsletter.status
    });
    setNewsletterDialogOpen(true);
  }

  function openSendNewsletter(newsletter: Newsletter) {
    setNewsletterToSend(newsletter);
    setNewsletterSendModalOpen(true);
  }

  function openDeleteNewsletter(newsletter: Newsletter) {
    setNewsletterToDelete(newsletter);
    setNewsletterDeleteModalOpen(true);
  }

  const closeNewsletterDeleteModal = () => {
    setNewsletterDeleteModalOpen(false);
    setNewsletterToDelete(null);
  };

  const confirmDeleteNewsletter = async () => {
    if (!newsletterToDelete) return;

    try {
      await deleteNewsletter(newsletterToDelete.id);
      toast.success('Newsletter deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast.error('Failed to delete newsletter');
    }
  };

  const closeNewsletterSendModal = () => {
    setNewsletterSendModalOpen(false);
    setNewsletterToSend(null);
  };

  const confirmSendNewsletter = async () => {
    if (!newsletterToSend) return;

    try {
      await sendNewsletter(newsletterToSend.id);
      toast.success('Newsletter sent successfully');
      loadData();
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error('Failed to send newsletter');
    }
  };

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Attempting to upload file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      setFileUploading(true);
      
      const result = await uploadPromotionalMaterial(file, {
        name: file.name,
        category: "general",
        tags: []
      });
      
      console.log('Upload successful:', result);
      toast.success('File uploaded successfully');
      loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      toast.error(errorMessage);
    } finally {
      setFileUploading(false);
    }
  }

  async function handleFileDelete(material: PromotionalMaterial) {
    setMaterialToDelete(material);
    setPromoDeleteModalOpen(true);
  }

  const closePromoDeleteModal = () => {
    setPromoDeleteModalOpen(false);
    setMaterialToDelete(null);
  };

  const confirmDeletePromoMaterial = async () => {
    if (!materialToDelete) return;

    try {
      await deletePromotionalMaterial(materialToDelete.id);
      toast.success('File deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Split campaigns into active and past
  const activeCampaigns = campaigns.filter(c => c.status === "active" || c.status === "paused");
  const pastCampaigns = campaigns.filter(c => c.status === "completed" || c.status === "draft");

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-3 sm:p-4 space-y-6">
        <PageHeaderSkeleton showActions={false} />
        <StatCardSkeleton count={4} />
        <CardGridSkeleton count={6} columns={3} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Marketing Dashboard</h1>
      <Tabs defaultValue="campaigns">
        <TabsList className="mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap bg-white dark:bg-gray-800 w-full lg:overflow-visible lg:whitespace-normal lg:justify-between">
          <TabsTrigger value="campaigns" aria-label="Campaigns" className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 lg:flex-1">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="newsletter" aria-label="Newsletter" className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 lg:flex-1">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
            Newsletter
          </TabsTrigger>
          <TabsTrigger value="promo" aria-label="Promo Materials" className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 lg:flex-1">
            <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
            Promo Materials
          </TabsTrigger>
          <TabsTrigger value="analytics" aria-label="Analytics" className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 lg:flex-1">
            <BarChart2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
            Analytics
          </TabsTrigger>
        </TabsList>
        
        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="border border-border rounded-lg p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">Campaigns</h2>
            <Button onClick={openAddCampaign} className="flex gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-sm sm:text-base">
              <PlusCircleIcon className="w-4 h-4" /> 
              <span className="text-sm sm:text-base">New Campaign</span>
            </Button>
          </div>

          {/* Active Campaigns */}
          <h3 className="text-base font-semibold mb-3 sm:mb-4">Active Campaigns</h3>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto mb-8 border border-border rounded-lg">
            <DataTable<MarketingCampaign>
              columns={[
                { header: "Name", accessor: "name" },
                { header: "Type", accessor: "campaign_type", cell: (row) => <Badge>{row.campaign_type}</Badge> },
                { header: "Status", accessor: "status", cell: (row) => <Badge>{row.status}</Badge> },
                { header: "Created", accessor: "created_at", cell: (row) => new Date(row.created_at).toLocaleDateString() },
                { header: "Actions", accessor: "actions", cell: (row) => (
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditCampaign(row)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleCampaignDelete(row)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) }
              ]}
              data={activeCampaigns}
              loading={loading}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3 mb-8">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.id} className="border border-border rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm sm:text-base">{campaign.name}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{campaign.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge className="text-xs">{campaign.campaign_type}</Badge>
                    <Badge variant="outline" className="text-xs">{campaign.status}</Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                  <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEditCampaign(campaign)} className="h-7 w-7 p-0">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCampaignDelete(campaign)} className="h-7 w-7 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {activeCampaigns.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No active campaigns</p>
              </div>
            )}
          </div>

          {/* Past Campaigns */}
          <h3 className="text-base font-semibold mb-3 sm:mb-4">Past Campaigns</h3>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto border border-border rounded-lg">
            <DataTable<MarketingCampaign>
              columns={[
                { header: "Name", accessor: "name" },
                { header: "Type", accessor: "campaign_type", cell: (row) => <Badge>{row.campaign_type}</Badge> },
                { header: "Status", accessor: "status", cell: (row) => <Badge>{row.status}</Badge> },
                { header: "Created", accessor: "created_at", cell: (row) => new Date(row.created_at).toLocaleDateString() },
                { header: "Actions", accessor: "actions", cell: (row) => (
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditCampaign(row)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleCampaignDelete(row)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) }
              ]}
              data={pastCampaigns}
              loading={loading}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {pastCampaigns.map((campaign) => (
              <div key={campaign.id} className="border border-border rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm sm:text-base">{campaign.name}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{campaign.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge className="text-xs">{campaign.campaign_type}</Badge>
                    <Badge variant="outline" className="text-xs">{campaign.status}</Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                  <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEditCampaign(campaign)} className="h-7 w-7 p-0">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCampaignDelete(campaign)} className="h-7 w-7 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {pastCampaigns.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No past campaigns</p>
              </div>
            )}
          </div>

          <FormModal
            open={campaignDialogOpen}
            onOpenChange={setCampaignDialogOpen}
            title={editingCampaign ? "Edit Campaign" : "Add Campaign"}
            onSubmit={handleCampaignSave}
            onCancel={closeCampaignDialog}
            loading={campaignSaving}
            submitText={campaignSaving ? "Saving..." : "Save"}
          >
            <FormField
              label="Name"
              value={campaignForm.name}
              onChange={(value) => handleCampaignFormChange("name", value)}
              placeholder="Campaign name"
              required
            />
            <FormField
              label="Description"
              value={campaignForm.description || ""}
              onChange={(value) => handleCampaignFormChange("description", value)}
              placeholder="Campaign description"
              type="textarea"
            />
            <FormField
              label="Campaign Type"
              value={campaignForm.campaign_type}
              onChange={(value) => handleCampaignFormChange("campaign_type", value)}
              type="select"
              options={CAMPAIGN_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            />
            <FormField
              label="Status"
              value={campaignForm.status}
              onChange={(value) => handleCampaignFormChange("status", value)}
              type="select"
              options={CAMPAIGN_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
            <FormField
              label="Start Date"
              value={campaignForm.start_date || ""}
              onChange={(value) => handleCampaignFormChange("start_date", value)}
              type="date"
              placeholder="Start date (optional)"
            />
            <FormField
              label="End Date"
              value={campaignForm.end_date || ""}
              onChange={(value) => handleCampaignFormChange("end_date", value)}
              type="date"
              placeholder="End date (optional)"
            />
            <FormField
              label="Budget"
              value={campaignForm.budget?.toString() || ""}
              onChange={(value) => handleCampaignFormChange("budget", value)}
              type="number"
              placeholder="Budget (optional)"
            />
          </FormModal>
        </TabsContent>
        
        {/* Newsletter Tab */}
        <TabsContent value="newsletter" className="border border-border rounded-lg p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">Newsletters</h2>
            <Button onClick={openNewsletter} className="flex gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-sm sm:text-base">
              <Mail className="w-4 h-4" /> 
              <span className="text-sm sm:text-base">Compose Newsletter</span>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No newsletters yet</h3>
              <p className="text-muted-foreground mb-4">Create your first newsletter to start engaging with your audience.</p>
              <Button onClick={openNewsletter} className="bg-primary hover:bg-primary/90">
                <Mail className="w-4 h-4 mr-2" />
                Create Newsletter
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {newsletters.map((newsletter) => (
                <Card key={newsletter.id} className="p-3 sm:p-4 border-border">
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-3 gap-3">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg">{newsletter.name}</h3>
                        <Badge variant={newsletter.status === 'sent' ? 'default' : newsletter.status === 'scheduled' ? 'secondary' : 'outline'} className="text-xs sm:text-sm w-fit">
                          {newsletter.status}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 mb-1">
                        Subject: {newsletter.subject}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                        Created: {new Date(newsletter.created_at).toLocaleDateString()}
                        {newsletter.sent_at && ` • Sent: ${new Date(newsletter.sent_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                      {newsletter.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditNewsletter(newsletter)}
                            className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden xs:inline">Edit</span>
                            <span className="xs:hidden">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openSendNewsletter(newsletter)}
                            className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                          >
                            <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden xs:inline">Send</span>
                            <span className="xs:hidden">Send</span>
                          </Button>
                        </>
                      )}
                      {newsletter.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSendNewsletter(newsletter)}
                          className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden xs:inline">Send Now</span>
                          <span className="xs:hidden">Now</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteNewsletter(newsletter)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground line-clamp-2">
                    {newsletter.content}
                  </p>
                </Card>
              ))}
            </div>
          )}
          
          <FormModal
            open={newsletterDialogOpen}
            onOpenChange={setNewsletterDialogOpen}
            title={editingNewsletter ? "Edit Newsletter" : "Compose Newsletter"}
            onSubmit={handleSendNewsletter}
            onCancel={() => {
              setNewsletterDialogOpen(false);
              setEditingNewsletter(null);
              setNewsletterForm({ name: "", subject: "", content: "", status: "draft" });
            }}
            loading={sendingNewsletter}
            submitText={sendingNewsletter ? "Saving..." : (editingNewsletter ? "Update" : "Save Draft")}
          >
            <FormField
              label="Name"
              value={newsletterForm.name}
              onChange={(value) => handleNewsletterFormChange("name", value)}
              placeholder="Newsletter name"
              required
            />
            <FormField
              label="Subject"
              value={newsletterForm.subject}
              onChange={(value) => handleNewsletterFormChange("subject", value)}
              placeholder="Newsletter subject"
              required
            />
            <FormField
              label="Content"
              value={newsletterForm.content}
              onChange={(value) => handleNewsletterFormChange("content", value)}
              placeholder="Newsletter content"
              type="textarea"
              rows={8}
              required
            />
          </FormModal>
        </TabsContent>
        
        {/* Promo Materials Tab */}
        <TabsContent value="promo" className="border border-border rounded-lg p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">Promotional Materials</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input 
                type="file" 
                onChange={handleFileUpload} 
                className="w-full sm:w-auto text-xs sm:text-sm"
                accept="image/*,.pdf,.doc,.docx"
                disabled={fileUploading}
              />
              {fileUploading && <span className="text-xs sm:text-sm text-muted-foreground">Uploading...</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {files.map((file) => (
              <Card key={file.id} className="p-3 sm:p-4 border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6">
                      {imageLoading[file.id] && (
                        <Skeleton className="w-6 h-6 absolute inset-0" />
                      )}
                      {!imageError[file.id] ? (
                        <NextImage
                          src={file.file_url}
                          alt={file.name}
                          fill
                          className={`text-gray-400 transition-opacity duration-300 ${
                            imageLoading[file.id] ? 'opacity-0' : 'opacity-100'
                          }`}
                          onLoad={() => setImageLoading(prev => ({ ...prev, [file.id]: false }))}
                          onError={() => {
                            setImageError(prev => ({ ...prev, [file.id]: true }));
                            setImageLoading(prev => ({ ...prev, [file.id]: false }));
                          }}
                          sizes="24px"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">?</span>
                        </div>
                      )}
                    </div>
                    <span className="font-medium truncate text-sm sm:text-base">{file.name}</span>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleFileDelete(file)}
                    aria-label={`Delete ${file.name}`}
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {formatFileSize(file.file_size)} • {file.file_type}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                    <span className="text-xs sm:text-sm">Download</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="border border-border rounded-lg p-3 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">Analytics</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
              <Card className="p-3 sm:p-4 border-border">
                <div className="font-semibold mb-2 text-sm sm:text-base">Total Campaigns</div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">{analytics.totalCampaigns}</div>
              </Card>
              <Card className="p-3 sm:p-4 border-border">
                <div className="font-semibold mb-2 text-sm sm:text-base">Total Newsletters</div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">{analytics.totalNewsletters}</div>
              </Card>
              <Card className="p-3 sm:p-4 border-border">
                <div className="font-semibold mb-2 text-sm sm:text-base">Promo Materials</div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">{analytics.totalMaterials}</div>
              </Card>
              <Card className="p-3 sm:p-4 border-border">
                <div className="font-semibold mb-2 text-sm sm:text-base">Avg Open Rate</div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">{analytics.averageOpenRate}%</div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CampaignDeleteDialog
        campaign={campaignToDelete}
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCampaign}
        isDeleting={false}
      />

      <PromoMaterialDeleteDialog
        material={materialToDelete}
        open={promoDeleteModalOpen}
        onClose={closePromoDeleteModal}
        onConfirm={confirmDeletePromoMaterial}
        isDeleting={false}
      />

      {/* Newsletter Modals */}
      <NewsletterDeleteDialog
        newsletter={newsletterToDelete}
        open={newsletterDeleteModalOpen}
        onClose={closeNewsletterDeleteModal}
        onConfirm={confirmDeleteNewsletter}
        isDeleting={false}
      />

      <NewsletterSendDialog
        newsletter={newsletterToSend}
        open={newsletterSendModalOpen}
        onClose={closeNewsletterSendModal}
        onConfirm={confirmSendNewsletter}
        isSending={sendingNewsletter}
      />
    </div>
  );
} 