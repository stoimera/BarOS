import { MenuItem, MenuCategory } from '@/types/menu';
import { api } from '@/lib/api/client';

// Fetch all menu items, with optional filters
export async function getMenuItems({
  category,
  available
}: { category?: MenuCategory; available?: boolean } = {}): Promise<MenuItem[]> {
  try {
  
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (typeof available === 'boolean') params.append('available', available.toString());
    
    const { data } = await api.get<{ data: MenuItem[] }>(`/api/menu-items?${params.toString()}`);
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    throw error;
  }
}

// Add a new menu item
export async function addMenuItem(item: Omit<MenuItem, 'id' | 'created_at'>): Promise<MenuItem> {
  try {
    const { data } = await api.post<MenuItem>('/api/menu-items', item);
    return data;
  } catch (error) {
    console.error('Failed to create menu item:', error);
    throw error;
  }
}

// Update an existing menu item
export async function updateMenuItem(id: string, updates: Partial<Omit<MenuItem, 'id' | 'created_at'>>): Promise<MenuItem> {
  try {
  
    const { data } = await api.put<MenuItem>(`/api/menu/${id}`, updates);
    return data;
  } catch (error) {
    console.error('Failed to update menu item:', error);
    throw error;
  }
}

// Delete a menu item
export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await api.delete(`/api/menu/${id}`);
  } catch (error) {
    console.error('Failed to delete menu item:', error);
    throw error;
  }
}

// Toggle menu item availability
export async function toggleMenuItemAvailability(id: string, available: boolean): Promise<MenuItem> {
  return updateMenuItem(id, { is_available: available });
} 