"use client";

import { useEffect, useState, useMemo } from "react";
import { getMenuItems } from "@/lib/menu";
import { MenuItem, MenuCategory } from "@/types/menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MenuCard } from "@/components/menu/MenuCard";
import { Wine, Utensils, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { WiSmoke } from "react-icons/wi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { paginateBySubcategories, paginateDrinksBySubcategories } from "@/lib/pagination";
import { 
  PageHeaderSkeleton,
  MenuItemSkeleton
} from "@/components/ui/loading-states";

// Helper to get unique tags for grouping
function getDrinkGroups(items: MenuItem[]) {
  // For cocktails, group by tag (Classic, Signature, Mocktail)
  const cocktails = items.filter(i => i.subcategory === "Cocktails");
  const cocktailGroups: Record<string, MenuItem[]> = {};
  ["Classic", "Signature", "Mocktail"].forEach(tag => {
    cocktailGroups[tag] = cocktails.filter(i => i.tags && i.tags.includes(tag));
  });
  
  // For other drinks, group by tags first, then by subcategory
  const nonCocktails = items.filter(i => i.subcategory !== "Cocktails");
  const tagGroups: Record<string, MenuItem[]> = {};
  
  // Group by tags (Vodka, Whiskey, Rum, etc.)
  nonCocktails.forEach(i => {
    if (i.tags && i.tags.length > 0) {
      i.tags.forEach(tag => {
        if (!tagGroups[tag]) {
          tagGroups[tag] = [];
        }
        tagGroups[tag].push(i);
      });
    } else {
      // If no tags, group by subcategory
      const sub = i.subcategory || "Other";
      if (!tagGroups[sub]) {
        tagGroups[sub] = [];
      }
      tagGroups[sub].push(i);
    }
  });
  
  return { cocktailGroups, tagGroups };
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

const CATEGORIES: { label: string; value: MenuCategory; icon?: React.ComponentType<{ className?: string }> }[] = [
  { label: "Drinks", value: "Drinks", icon: Wine },
  { label: "Food", value: "Food", icon: Utensils },
  { label: "Shisha", value: "Shisha", icon: WiSmoke },
];

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
  "Mocktail",
  "Alcoholic Drinks"
];

export default function CustomerMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<MenuCategory>("Drinks");
  const [added, setAdded] = useState<string[]>([]); // ids of items added to booking (mocked)
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const itemsPerPage = 20; // Changed from 12 to 20 to match main menu
  
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setLoading(true);
        setError("");
        const items = await getMenuItems({ available: true });
        setMenuItems(items);
      } catch (err) {
        console.error("Error loading menu items:", err);
        setError("Failed to load menu items");
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [category, search]);

  // Filter and group logic
  const filteredItems = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const filtered = menuItems.filter(item => {
      if (item.category !== category) return false;
      if (!lower) return true;
      const nameMatch = item.name.toLowerCase().includes(lower);
      const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(lower));
      return nameMatch || tagMatch;
    });
    return filtered;
  }, [menuItems, category, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-4 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeaderSkeleton showActions={false} />
          <MenuItemSkeleton count={9} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-4 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Menu</h1>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 text-center">Menu</h1>
          <p className="text-sm sm:text-base text-muted-foreground text-center">Discover our delicious offerings</p>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-card border-border text-sm sm:text-base"
            />
          </div>
        </div>

        <Tabs value={category} onValueChange={v => setCategory(v as MenuCategory)}>
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger
              value="Drinks"
              className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:bg-primary text-xs sm:text-sm"
            >
              <Wine className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Drinks</span>
              <span className="sm:hidden">Drinks</span>
            </TabsTrigger>
            <TabsTrigger
              value="Food"
              className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:bg-primary text-xs sm:text-sm"
            >
              <Utensils className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Food</span>
              <span className="sm:hidden">Food</span>
            </TabsTrigger>
            <TabsTrigger
              value="Shisha"
              className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:bg-primary text-xs sm:text-sm"
            >
              <WiSmoke className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Shisha</span>
              <span className="sm:hidden">Shisha</span>
            </TabsTrigger>
          </TabsList>

          {CATEGORIES.map(cat => {
            const itemsForCat = filteredItems.filter(i => i.category === cat.value);

            if (cat.value === "Drinks") {
              // Use specialized pagination for drinks that respects subcategory boundaries
              const { tagGroups: paginatedGroups, totalPages } = paginateDrinksBySubcategories(
                itemsForCat,
                getDrinkGroups,
                DRINK_GROUP_ORDER,
                currentPage,
                itemsPerPage
              );
              
              return (
                <TabsContent key={cat.value} value={cat.value} className="mt-4 sm:mt-6">
                  {itemsForCat.length === 0 ? (
                    <Card className="bg-card">
                      <CardContent className="p-6 sm:p-8 text-center">
                        <Wine className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium mb-2 dark:text-white">No Drinks Available</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">Check back later for our drink menu.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Non-cocktail drink groups */}
                      {DRINK_GROUP_ORDER.map(group => (
                        paginatedGroups[group]?.length > 0 && (
                          <div key={group} className="mb-8 sm:mb-12">
                            <h3 className="text-lg sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">{group}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                              {paginatedGroups[group].map(item => (
                                <MenuCard
                                  key={item.id}
                                  item={item}
                                  onAdd={() => setAdded(a => a.includes(item.id) ? a : [...a, item.id])}
                                  added={added.includes(item.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </>
                  )}
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                        disabled={currentPage === 1}
                        className="bg-card h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <span className="text-xs sm:text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                        disabled={currentPage === totalPages}
                        className="bg-card h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            }

            if (cat.value === "Food") {
              // Get all subcategories for food
              const groups = getFoodGroups(itemsForCat);
              const foodSubcategories = Object.keys(groups);
              
              // Use new pagination that respects subcategory boundaries
              const { groups: paginatedGroups, totalPages } = paginateBySubcategories(
                itemsForCat,
                getFoodGroups,
                foodSubcategories,
                currentPage,
                itemsPerPage
              );
              
              return (
                <TabsContent key={cat.value} value={cat.value} className="mt-4 sm:mt-6">
                  {itemsForCat.length === 0 ? (
                    <Card className="bg-card">
                      <CardContent className="p-6 sm:p-8 text-center">
                        <Utensils className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium mb-2 dark:text-white">No Food Available</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">Check back later for our food menu.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {Object.entries(paginatedGroups).map(([subcat, group]) => (
                        group.length > 0 && (
                          <div key={subcat} className="mb-8 sm:mb-12">
                            <h3 className="text-lg sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">{subcat}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                              {group.map(item => (
                                <MenuCard
                                  key={item.id}
                                  item={item}
                                  onAdd={() => setAdded(a => a.includes(item.id) ? a : [...a, item.id])}
                                  added={added.includes(item.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </>
                  )}
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                        disabled={currentPage === 1}
                        className="bg-card h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <span className="text-xs sm:text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                        disabled={currentPage === totalPages}
                        className="bg-card h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            }

            if (cat.value === "Shisha") {
              // Get all subcategories for shisha
              const groups = getShishaGroups(itemsForCat);
              const shishaSubcategories = Object.keys(groups);
              
              // Use new pagination that respects subcategory boundaries
              const { groups: paginatedGroups, totalPages } = paginateBySubcategories(
                itemsForCat,
                getShishaGroups,
                shishaSubcategories,
                currentPage,
                itemsPerPage
              );
              
              return (
                <TabsContent key={cat.value} value={cat.value} className="mt-4 sm:mt-6">
                  {itemsForCat.length === 0 ? (
                    <Card className="bg-card">
                      <CardContent className="p-6 sm:p-8 text-center">
                        <WiSmoke className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium mb-2 dark:text-white">No Shisha Available</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">Check back later for our shisha menu.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {Object.entries(paginatedGroups).map(([subcat, group]) => (
                        group.length > 0 && (
                          <div key={subcat} className="mb-8 sm:mb-12">
                            <h3 className="text-lg sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">{subcat}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                              {group.map(item => (
                                <MenuCard
                                  key={item.id}
                                  item={item}
                                  onAdd={() => setAdded(a => a.includes(item.id) ? a : [...a, item.id])}
                                  added={added.includes(item.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </>
                  )}
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                        disabled={currentPage === 1}
                        className="bg-card h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <span className="text-xs sm:text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                        disabled={currentPage === totalPages}
                        className="bg-card h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            }

            return null;
          })}
        </Tabs>
      </div>
    </div>
  );
} 