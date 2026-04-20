"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from "@/lib/menu";
import { MenuItem, MenuCategory } from "@/types/menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Edit as EditIcon, 
  Trash2, 
  Search as SearchIcon, 
  Package as PackageIcon, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-display/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { FormModal } from "@/components/shared/FormModal";
import { FormField } from "@/components/shared/FormField";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { paginateBySubcategories } from "@/lib/pagination";
import { 
  PageHeaderSkeleton,
  MenuItemSkeleton
} from "@/components/ui/loading-states";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORIES: MenuCategory[] = ["Drinks", "Food", "Shisha"];

const DRINK_GROUP_ORDER = [
  "Coffee",
  "Chocolate",
  "Tea",
  "Fresh Drinks",
  "Soft Drinks",
  "Beer",
  "Wine",
  "Champagne",
  "Vodka",
  "Whiskey",
  "Bourbon",
  "Gin",
  "Tequila",
  "Rum",
  "Cognac",
  "Liqueur",
  "Classic",
  "Signature",
  "Mocktail"
];

// Form state type that allows for partial data during editing
type MenuFormState = {
  name?: string;
  description?: string;
  price?: number;
  category?: MenuCategory;
  subcategory?: string;
  image_url?: string;
  tags?: string[];
  allergens?: string[];
  is_available?: boolean;
};

// Helper to get unique tags for grouping
function getDrinkGroups(items: MenuItem[]) {
  // Group by tags (this matches the seed data structure)
  const tagGroups: Record<string, MenuItem[]> = {};
  
  items.forEach(item => {
    if (item.tags && item.tags.length > 0) {
      // Use the first tag as the category
      const category = item.tags[0];
      if (!tagGroups[category]) {
        tagGroups[category] = [];
      }
      tagGroups[category].push(item);
    } else {
      // Fallback for items without tags
      const sub = item.subcategory || "Other";
      if (!tagGroups[sub]) {
        tagGroups[sub] = [];
      }
      tagGroups[sub].push(item);
    }
  });

  return { cocktailGroups: {}, tagGroups };
}

// Helper function for pagination that returns the expected structure
function getDrinkGroupsForPagination(items: MenuItem[]): Record<string, MenuItem[]> {
  const { tagGroups } = getDrinkGroups(items);
  return tagGroups;
}

function getFoodGroups(items: MenuItem[]) {
  // Group by subcategory (Pizza, Salads, Snacks, etc.)
  const groups: Record<string, MenuItem[]> = {};
  items.forEach(i => {
    const sub = i.subcategory || "Other";
    if (!groups[sub]) groups[sub] = [];
    groups[sub].push(i);
  });
  return groups;
}

function getShishaGroups(items: MenuItem[]) {
  // Group by subcategory (Flavors, Offers, Extra Enjoy)
  const groups: Record<string, MenuItem[]> = {};
  items.forEach(i => {
    const sub = i.subcategory || "Other";
    if (!groups[sub]) groups[sub] = [];
    groups[sub].push(i);
  });
  return groups;
}

export default function AdminMenuPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<MenuCategory | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuFormState>({ is_available: true });
  const [saving, setSaving] = useState(false);
  // Pagination state for 'All' tab
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  // Search state for 'All' tab
  const [search, setSearch] = useState("");
  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Pagination and search state for category tabs
  const [tabPage, setTabPage] = useState(1);
  const [tabSearch, setTabSearch] = useState("");
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);

      // Define consistent columns for all menu tables (inside component for access to handlers)
    const menuTableColumns = [
      { header: "Name", key: "name", className: "w-24 sm:w-32 md:w-48", cell: (row: MenuItem) => row.name },
      { header: "Category", key: "category", className: "w-16 sm:w-20 md:w-32", cell: (row: MenuItem) => row.category },
      { header: "Price", key: "price", className: "w-12 sm:w-16 md:w-24", cell: (row: MenuItem) => `€${row.price.toFixed(2)}` },
      { header: "Available", key: "is_available", className: "w-16 sm:w-20 md:w-24", cell: (row: MenuItem) => (
        <Switch checked={row.is_available} onCheckedChange={() => handleToggleAvailable(row)} className="data-[state=checked]:bg-primary" />
      ) },
      { header: "Tags", key: "tags", className: "w-20 sm:w-24 md:w-40", cell: (row: MenuItem) => (
        <div className="flex flex-wrap gap-1">{row.tags && row.tags.map(tag => <Badge key={tag} className="bg-primary text-primary-foreground text-xs">{tag}</Badge>)}</div>
      ) },
      { header: "Actions", key: "actions", className: "w-16 sm:w-20 md:w-32", cell: (row: MenuItem) => (
        <div className="flex gap-1 sm:gap-2">
          <Button size="icon" variant="ghost" onClick={() => openEdit(row)} aria-label="Edit Menu Item" className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"><EditIcon className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => openDeleteModal(row)} aria-label="Delete Menu Item" className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"><Trash2 className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4" /></Button>
        </div>
      ) }
    ];

  const handleFormChange = useCallback((field: string, value: string) => {
    setForm(prev => {
      // Handle special field conversions
      if (field === "price") {
        const numValue = value ? parseFloat(value) : 0;
        return { ...prev, price: numValue };
      }
      if (field === "tags") {
        const tagsArray = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
        return { ...prev, tags: tagsArray };
      }
      if (field === "is_available") {
        return { ...prev, is_available: value === "true" };
      }
      // Default string handling for other fields
      if (field === "name") return { ...prev, name: value };
      if (field === "description") return { ...prev, description: value };
      if (field === "category") return { ...prev, category: value as MenuCategory };
      if (field === "subcategory") return { ...prev, subcategory: value };
      if (field === "notes") return { ...prev, notes: value };
      return prev;
    });
  }, []);

  const categoryOptions = useMemo(() => 
    CATEGORIES.map(cat => ({ value: cat, label: cat })), 
    []
  );

  // Protect route: only authenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getMenuItems({ category }).then(data => {
        setItems(data);
      }).finally(() => setLoading(false));
    }
  }, [category, user]);

  function openAdd() {
    setEditing(null);
    setForm({ is_available: true });
    setDialogOpen(true);
  }
  function openEdit(item: MenuItem) {
    setEditing(item);
    setForm(item);
    setDialogOpen(true);
  }
  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm({ is_available: true });
  }
  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await updateMenuItem(editing.id, form);
      } else {
        await addMenuItem(form as Omit<MenuItem, "id" | "created_at">);
      }
      setDialogOpen(false);
      setEditing(null);
      setForm({ is_available: true });
      setItems(await getMenuItems({ category }));
    } finally {
      setSaving(false);
    }
  }
  function openDeleteModal(item: MenuItem) {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    setItemToDelete(null);
    setDeleting(false);
  }

  async function handleDelete() {
    if (!itemToDelete) return;
    
    try {
      setDeleting(true);
      await deleteMenuItem(itemToDelete.id);
      setItems(await getMenuItems({ category }));
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      // You could add a toast notification here
    } finally {
      setDeleting(false);
    }
  }
  async function handleToggleAvailable(item: MenuItem) {
    await toggleMenuItemAvailability(item.id, !item.is_available);
    setItems(await getMenuItems({ category }));
  }

  // Filtered items for 'All' tab
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const term = search.trim().toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(term)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }, [items, search]);

  // Handle image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error } = await supabase.storage.from('menu-items').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) throw error;
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('menu-items').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // Helper to filter items
  function filterItems(items: MenuItem[], search: string) {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(term)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }

  // Reset tab page/search on tab/category change
  useEffect(() => {
    setTabPage(1);
    setTabSearch("");
  }, [category]);

  if (loading && items.length === 0) {
    return (
      <div className="p-3 sm:p-6 max-w-6xl mx-auto">
        <PageHeaderSkeleton />
        <MenuItemSkeleton count={9} />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Menu Management</h1>
        <Button onClick={openAdd} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="text-sm sm:text-base">Add Item</span>
        </Button>
      </div>
      <Tabs value={category || "all"} onValueChange={v => { setCategory(v === "all" ? undefined : v as MenuCategory); setCurrentPage(1); }}>
        <TabsList className="w-full bg-white border border-border rounded-md lg:justify-between lg:overflow-visible lg:whitespace-normal">
          <TabsTrigger value="all" className="text-xs sm:text-sm lg:flex-1">All</TabsTrigger>
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm lg:flex-1">{cat}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="border border-border rounded-lg">
          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-4 max-w-md">
            <span className="text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full border-border focus:ring-primary text-sm sm:text-base"
              aria-label="Search menu items"
            />
          </div>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <DataTable
              columns={menuTableColumns}
              data={[...filteredItems].sort((a, b) => a.name.localeCompare(b.name)).slice((currentPage - 1) * pageSize, currentPage * pageSize)}
              loading={loading}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) => (
              <div key={item.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-sm font-medium">€{item.price.toFixed(2)}</span>
                    <Switch checked={item.is_available} onCheckedChange={() => handleToggleAvailable(item)} className="data-[state=checked]:bg-primary" />
                  </div>
                </div>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <Badge key={tag} className="bg-primary text-primary-foreground text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-1 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-7 w-7 p-0">
                    <EditIcon className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openDeleteModal(item)} className="h-7 w-7 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No menu items found</p>
              </div>
            )}
          </div>
          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-4 mt-4">
            <div className="text-sm text-muted-foreground sm:hidden">
              Showing {filteredItems.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} items
            </div>
            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={loading} aria-label="Previous page" className="text-xs sm:text-sm">
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
              <span className="text-xs sm:text-sm">Page {currentPage}</span>
              {currentPage * pageSize < filteredItems.length && (
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={loading} aria-label="Next page" className="text-xs sm:text-sm">
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
        {CATEGORIES.map(cat => (
          <TabsContent key={cat} value={cat} className="border border-border rounded-lg">
            {/* Search Bar */}
            <div className="flex items-center gap-2 mb-4 max-w-md">
              <span className="text-muted-foreground">
                <SearchIcon className="h-4 w-4" />
              </span>
              <Input
                placeholder={`Search ${cat.toLowerCase()}...`}
                value={tabSearch}
                onChange={e => { setTabSearch(e.target.value); setTabPage(1); }}
                className="w-full border-border focus:ring-primary text-sm sm:text-base"
                aria-label={`Search ${cat.toLowerCase()}`}
              />
            </div>
            {(() => {
              const itemsForCat = items.filter(i => i.category === cat);
              // Flatten all items for this category for search/pagination
              const filteredItems = filterItems(itemsForCat, tabSearch);
              let grouped: Record<string, MenuItem[]> = {};
              let totalPages = 1;
              
              if (cat === "Drinks") {
                const { tagGroups } = getDrinkGroups(filteredItems);
                const subcategoryOrder = Object.keys(tagGroups);
                const { groups: paginatedGroups, totalPages: pages } = paginateBySubcategories(
                  filteredItems,
                  getDrinkGroupsForPagination,
                  subcategoryOrder,
                  tabPage,
                  pageSize
                );
                grouped = paginatedGroups;
                totalPages = pages;
              } else if (cat === "Food") {
                const groups = getFoodGroups(filteredItems);
                const subcategoryOrder = Object.keys(groups);
                const { groups: paginatedGroups, totalPages: pages } = paginateBySubcategories(
                  filteredItems,
                  getFoodGroups,
                  subcategoryOrder,
                  tabPage,
                  pageSize
                );
                grouped = paginatedGroups;
                totalPages = pages;
              } else if (cat === "Shisha") {
                const groups = getShishaGroups(filteredItems);
                const subcategoryOrder = Object.keys(groups);
                const { groups: paginatedGroups, totalPages: pages } = paginateBySubcategories(
                  filteredItems,
                  getShishaGroups,
                  subcategoryOrder,
                  tabPage,
                  pageSize
                );
                grouped = paginatedGroups;
                totalPages = pages;
              }
              // For Drinks, preserve group order
              const groupOrder = cat === "Drinks" ? DRINK_GROUP_ORDER.filter(g => grouped[g]?.length > 0) : Object.keys(grouped);
              return (
                <>
                  <Card className="mb-12">
                    <CardContent className="p-0">
                                             <Table className="table-fixed w-full">
                         <TableHeader>
                           <TableRow>
                             <TableHead className="w-24 sm:w-32 md:w-48">Name</TableHead>
                             <TableHead className="w-16 sm:w-20 md:w-32">Category</TableHead>
                             <TableHead className="w-12 sm:w-16 md:w-24">Price</TableHead>
                             <TableHead className="w-16 sm:w-20 md:w-24">Available</TableHead>
                             <TableHead className="w-20 sm:w-24 md:w-40">Tags</TableHead>
                             <TableHead className="w-16 sm:w-20 md:w-32">Actions</TableHead>
                           </TableRow>
                         </TableHeader>
                        <TableBody>
                          {groupOrder.map((group, idx) => [
                            idx > 0 && (
                              <TableRow key={group + "-spacer"}>
                                <TableCell colSpan={6} className="h-6 bg-transparent border-none"></TableCell>
                              </TableRow>
                            ),
                            <TableRow key={group + "-header"}>
                              <TableCell colSpan={6} className="font-bold text-primary dark:text-blue-400 bg-gray-50 dark:bg-slate-800 text-base sm:text-lg py-3 sm:py-4 border-t-0 rounded-t-md">{group}</TableCell>
                            </TableRow>,
                            ...grouped[group].map(item => (
                              <TableRow key={item.id}>
                                <TableCell className="text-sm sm:text-base font-medium">{item.name}</TableCell>
                                <TableCell className="text-xs sm:text-sm">{item.category}</TableCell>
                                <TableCell className="text-sm font-medium">€{item.price.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Switch checked={item.is_available} onCheckedChange={() => handleToggleAvailable(item)} className="data-[state=checked]:bg-primary" />
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">{item.tags && item.tags.map(tag => <Badge key={tag} className="bg-primary text-primary-foreground text-xs">{tag}</Badge>)}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 sm:gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)} aria-label="Edit Menu Item" className="h-7 w-7 sm:h-8 sm:w-8"><EditIcon className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                                    <Button size="icon" variant="ghost" onClick={() => openDeleteModal(item)} aria-label="Delete Menu Item" className="h-7 w-7 sm:h-8 sm:w-8"><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ])}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-4 mt-4">
                    <div className="text-sm text-muted-foreground sm:hidden">
                      Page {tabPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      {tabPage > 1 && (
                        <Button variant="outline" size="sm" onClick={() => setTabPage(tabPage - 1)} aria-label="Previous page" className="text-xs sm:text-sm">
                          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                      <span className="text-xs sm:text-sm">Page {tabPage} of {totalPages}</span>
                      {tabPage < totalPages && (
                        <Button variant="outline" size="sm" onClick={() => setTabPage(tabPage + 1)} aria-label="Next page" className="text-xs sm:text-sm">
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </TabsContent>
        ))}
      </Tabs>
      <FormModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Menu Item" : "Add Menu Item"}
        onSubmit={handleSave}
        onCancel={closeDialog}
        loading={saving}
        submitText={saving ? "Saving..." : "Save"}
        maxWidth="max-w-2xl"
      >
        <FormField
          label="Name"
          value={form.name || ""}
          onChange={(value) => handleFormChange("name", value)}
          placeholder="Menu item name"
          required
        />
        <FormField
          label="Description"
          value={form.description || ""}
          onChange={(value) => handleFormChange("description", value)}
          placeholder="Menu item description"
          type="textarea"
        />
        <FormField
          label="Price (€)"
          value={form.price?.toString() || ""}
          onChange={(value) => handleFormChange("price", value)}
          type="number"
          step={0.01}
          min={0}
          required
        />
        <FormField
          label="Category"
          value={form.category || ""}
          onChange={(value) => handleFormChange("category", value)}
          type="select"
          options={categoryOptions}
          required
        />
        <FormField
          label="Subcategory"
          value={form.subcategory || ""}
          onChange={(value) => handleFormChange("subcategory", value)}
          placeholder="Subcategory (optional)"
        />
        <FormField
          label="Tags"
          value={form.tags?.join(", ") || ""}
          onChange={(value) => handleFormChange("tags", value)}
          placeholder="Tags (comma separated)"
        />
        <div className="flex items-center gap-2">
          <Switch 
            checked={form.is_available} 
            onCheckedChange={(value) => handleFormChange("is_available", value.toString())} 
          />
          <span>Available</span>
        </div>
        {/* Image upload */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm font-medium">Image</label>
          {form.image_url && (
            <Image
              src={form.image_url}
              alt="Menu item image preview"
              width={256}
              height={128}
              className="h-32 w-auto rounded border object-contain mb-2"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-border file:bg-background file:text-sm file:cursor-pointer cursor-pointer"
          />
          {uploading && <span className="text-xs text-primary">Uploading...</span>}
          {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
        </div>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={closeDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Delete Menu Item
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {itemToDelete && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <PackageIcon className="h-4 w-4 text-primary dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{itemToDelete.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {itemToDelete.category} • €{itemToDelete.price?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Warning
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      Deleting this menu item will remove it from all menus and customer views. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 sm:flex-none"
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Menu Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 