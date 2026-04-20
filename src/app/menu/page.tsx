"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Wine, 
  Utensils, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowLeft, 
  ArrowRight,
} from "lucide-react";
import { WiSmoke } from "react-icons/wi";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getMenuItems } from "@/lib/menu";
import { MenuItem, MenuCategory } from "@/types/menu";
import { MenuCard } from "@/components/menu/MenuCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { paginateBySubcategories, paginateDrinksBySubcategories } from "@/lib/pagination";
import { MenuItemSkeleton } from "@/components/ui/skeletons";

// Category configuration with icons
const categoryConfig = {
  'Drinks': {
    icon: Wine,
    description: "Handcrafted cocktails, artisan coffee, and craft beers",
    color: "from-blue-500 to-purple-600"
  },
  'Food': {
    icon: Utensils,
    description: "Chef-curated small plates and gourmet bites",
    color: "from-orange-500 to-red-600"
  },
  'Shisha': {
    icon: WiSmoke,
    description: "Premium shisha flavors and hookah service",
    color: "from-green-500 to-teal-600"
  }
};

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

const MENU_CATEGORIES: MenuCategory[] = ["Drinks", "Food", "Shisha"];

export default function MenuPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(MENU_CATEGORIES[0]);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);

  useEffect(() => {
    loadMenuData();
  }, []);

  // Handle hash navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash && MENU_CATEGORIES.includes(hash as MenuCategory)) {
        setActiveCategory(hash as MenuCategory);
      }
    }
  }, []);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  async function loadMenuData() {
    try {
      setLoading(true);
      setError(null);
    ;
      // Fetch all available menu items
      const items = await getMenuItems({ available: true });
      
      setMenuItems(items);
    } catch (error) {
      console.error("Error loading menu:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      } else {
        console.error("Non-Error thrown:", error);
      }
      setError('Failed to load menu. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Group menu items by category (case-insensitive)
  const menuByCategory = menuItems.reduce((acc, item) => {
    const key = (item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase()) as MenuCategory;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<MenuCategory, MenuItem[]>);

  function getCategoryDescription(category: MenuCategory) {
    return categoryConfig[category]?.description || "Delicious offerings from our kitchen";
  }

  // Helper to get unique subcategories for grouping
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



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-4">Our Menu</h1>
            <p className="text-amber-700 dark:text-amber-300">Loading our delicious menu...</p>
          </div>
          <MenuItemSkeleton count={9} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <Utensils className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Menu Unavailable</h2>
            <p className="text-lg">{error}</p>
          </div>
          <Button onClick={loadMenuData} className="bg-amber-600 hover:bg-amber-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-neutral-50 dark:bg-slate-900 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="text-amber-600 hover:text-amber-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">UL</span>
              </div>
              <span className="font-bold text-lg text-rose-800 dark:text-amber-400">Urban Lounge</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle 
              iconClassName="!text-amber-500 dark:!text-amber-400"
              buttonClassName="border-border hover:bg-muted hover:text-foreground"
              dropdownClassName="border-amber-400 dark:border-amber-400"
              dropdownItemClassName="focus:bg-muted focus:text-foreground"
            />
            <Button 
              variant="outline" 
              onClick={() => setReservationModalOpen(true)} 
              className="border-amber-400 text-rose-800 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-400 dark:hover:bg-amber-900 dark:hover:text-amber-300"
            >
              Reserve Your Table
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-amber-900 dark:text-amber-100 mb-4">
            Our Menu
          </h1>
          <p className="text-xl text-amber-700 dark:text-amber-300 max-w-2xl mx-auto mb-8">
            Discover our carefully curated selection of drinks, food, and premium shisha.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              <span>Open Daily 08:00 AM - 00:00 AM</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <MapPin className="h-5 w-5" />
              <span>Partizanski Odredi 47</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Phone className="h-5 w-5" />
              <span>+389 123-456-789</span>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as MenuCategory)}>
            <div className="flex justify-center mb-8 border border-amber-100 rounded-xl overflow-hidden bg-amber-50 dark:bg-slate-900 dark:border-amber-800">
              <TabsList className="flex w-full dark:bg-slate-900">
                <TabsTrigger
                  value="Drinks"
                  className="flex-1 flex items-center justify-center px-6 min-w-0 text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:font-semibold data-[state=active]:opacity-100 opacity-60 dark:text-amber-700 dark:bg-slate-800 dark:border-amber-800 z-index-10"
                >
                  <Wine className="mr-2" />
                  Drinks
                </TabsTrigger>
                <TabsTrigger
                  value="Food"
                  className="flex-1 flex items-center justify-center px-6 min-w-0 text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:font-semibold data-[state=active]:opacity-100 opacity-60 dark:text-amber-700 dark:bg-slate-800"
                >
                  <Utensils className="mr-2 w-6 h-6" />
                  Food
                </TabsTrigger>
                <TabsTrigger
                  value="Shisha"
                  className="flex-1 flex items-center justify-center px-6 min-w-0 text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:font-semibold data-[state=active]:opacity-100 opacity-60 dark:text-amber-700 dark:bg-slate-800"
                >
                  <WiSmoke className="mr-2 w-8 h-8" size={32} />
                  Shisha
                </TabsTrigger>
              </TabsList>
            </div>
            {MENU_CATEGORIES.map(category => {
              const items = menuByCategory[category] || [];
              if (items.length === 0) {
                return (
                  <TabsContent key={category} value={category}>
                    <div className="text-center py-10 text-muted-foreground">No items in this category.</div>
                  </TabsContent>
                );
              }
              
              if (category === "Drinks") {
                // Use specialized pagination for drinks that respects subcategory boundaries
                const { tagGroups: paginatedGroups, totalPages } = paginateDrinksBySubcategories(
                  items,
                  getDrinkGroups,
                  DRINK_GROUP_ORDER,
                  currentPage,
                  itemsPerPage
                );
                
                return (
                  <TabsContent key={category} value={category}>
                    <div className="mt-2 rounded-md bg-background p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-600 mb-2">Drinks</h2>
                        <p className="text-lg text-amber-700 dark:text-amber-400">{getCategoryDescription(category)}</p>
                      </div>
                      {DRINK_GROUP_ORDER.map(group => (
                        paginatedGroups[group]?.length > 0 && (
                          <div key={group} className="mb-12">
                            <h3 className="text-2xl font-semibold text-amber-800 mb-4 dark:text-amber-600">{group}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                              {paginatedGroups[group].map((item: MenuItem) => <MenuCard key={item.id} item={item} />)}
                            </div>
                          </div>
                        )
                      ))}
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="border-amber-400 text-amber-600 hover:bg-amber-50"
                          >
                            Previous
                          </Button>
                          <span className="text-amber-700 dark:text-amber-300">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="border-amber-400 text-amber-600 hover:bg-amber-50"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              }
              if (category === "Food") {
                // Get all subcategories for food
                const groups = getFoodGroups(items);
                const foodSubcategories = Object.keys(groups);
                
                // Use new pagination that respects subcategory boundaries
                const { groups: paginatedGroups, totalPages } = paginateBySubcategories(
                  items,
                  getFoodGroups,
                  foodSubcategories,
                  currentPage,
                  itemsPerPage
                );
                
                return (
                  <TabsContent key={category} value={category}>
                    <div className="mt-2 rounded-md bg-background p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-600 mb-2">Food</h2>
                        <p className="text-lg text-amber-700 dark:text-amber-400">{getCategoryDescription(category)}</p>
                      </div>
                      {Object.entries(paginatedGroups).map(([subcat, group]) => (
                        group.length > 0 && (
                          <div key={subcat} className="mb-12">
                            <h3 className="text-2xl font-semibold text-amber-800 mb-4 dark:text-amber-600">{subcat}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                              {group.map((item: MenuItem) => <MenuCard key={item.id} item={item} />)}
                            </div>
                          </div>
                        )
                      ))}
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="border-amber-400 text-amber-600 hover:bg-amber-50"
                          >
                            Previous
                          </Button>
                          <span className="text-amber-700 dark:text-amber-300">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="border-amber-400 text-amber-600 hover:bg-amber-50"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              }
              if (category === "Shisha") {
                // Get all subcategories for shisha
                const groups = getShishaGroups(items);
                const shishaSubcategories = Object.keys(groups);
                
                // Use new pagination that respects subcategory boundaries
                const { groups: paginatedGroups, totalPages } = paginateBySubcategories(
                  items,
                  getShishaGroups,
                  shishaSubcategories,
                  currentPage,
                  itemsPerPage
                );
                
                return (
                  <TabsContent key={category} value={category}>
                    <div className="mt-2 rounded-md bg-background p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-600 mb-2">Shisha</h2>
                        <p className="text-lg text-amber-700 dark:text-amber-400">{getCategoryDescription(category)}</p>
                      </div>
                      {Object.entries(paginatedGroups).map(([subcat, group]) => (
                        group.length > 0 && (
                          <div key={subcat} className="mb-12">
                            <h3 className="text-2xl font-semibold text-amber-800 mb-4 dark:text-amber-600">{subcat}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                              {group.map((item: MenuItem) => <MenuCard key={item.id} item={item} />)}
                            </div>
                          </div>
                        )
                      ))}
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="border-amber-400 text-amber-600 hover:bg-amber-50"
                          >
                            Previous
                          </Button>
                          <span className="text-amber-700 dark:text-amber-300">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="border-amber-400 text-amber-600 hover:bg-amber-50"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              }
              return null;
            })}
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-4">
            Ready to Experience Our Menu?
          </h2>
          <p className="text-lg text-amber-700 dark:text-amber-300 mb-8 max-w-2xl mx-auto">
            Reserve your table and enjoy our delicious offerings in our welcoming atmosphere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setReservationModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Reserve Your Table
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="border-amber-400 text-amber-600 bg-white hover:bg-amber-50 hover:text-amber-700">
                  Contact Us
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-neutral-50 dark:bg-slate-900">
                <DialogHeader>
                  <DialogTitle className="text-rose-800 dark:text-amber-400">Contact Us</DialogTitle>
                  <DialogDescription className="text-foreground">
                    Reach out to us for reservations, events, or any questions!
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-amber-400" />
                    <span className="text-sm text-foreground">urbanlounge@email.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-amber-400" />
                    <span className="text-sm text-foreground">+389 123-456-789</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-amber-400" />
                    <span className="text-sm text-foreground">Partizanski Odredi 47</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Reservation Modal */}
      <Dialog open={reservationModalOpen} onOpenChange={setReservationModalOpen}>
        <DialogContent className="max-w-md bg-neutral-50 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-rose-800 dark:text-amber-400">Reserve Your Table</DialogTitle>
            <DialogDescription className="text-foreground">
              Choose how you&apos;d like to make your reservation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
            >
              Login to Reserve
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              or
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg border border-border">
              <Phone className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <span className="text-xl font-semibold text-amber-900 dark:text-amber-100">+389 123-456-789</span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Call us directly to make your reservation
              </p>
                              <p className="text-sm text-muted-foreground">
                  Available daily from 08:00 AM to 00:00 AM
                </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="w-full bg-neutral-50 dark:bg-slate-900 backdrop-blur-md border-t border-border py-2">
        <div className="container mx-auto px-4 text-center text-amber-700 dark:text-amber-400">
          <p>&copy; {new Date().getFullYear()} Urban Lounge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 