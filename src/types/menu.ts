export type MenuCategory = 'Drinks' | 'Food' | 'Shisha';

// Subcategory is a string for now, will be extended later
export type MenuSubcategory = string;

export type MenuItem = {
  id: string; // UUID
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  subcategory?: MenuSubcategory;
  image_url?: string;
  tags: string[];
  allergens?: string[];
  is_available: boolean;
  is_featured?: boolean;
  cost?: number;
  requires_age_verification?: boolean;
  min_age?: number;
  created_at: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
  created_by?: string; // UUID
}; 