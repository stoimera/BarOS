import { MenuItem } from '@/types/menu';

// Generic pagination function that respects subcategory boundaries
export function paginateBySubcategories<T>(
  items: T[],
  groupFunction: (items: T[]) => Record<string, T[]>,
  groupOrder: string[],
  page: number,
  itemsPerPage: number
) {
  // First, group all items by subcategory
  const allGroups = groupFunction(items);
  
  // Create ordered groups based on the provided order
  const orderedGroups: Array<{ name: string; items: T[] }> = [];
  groupOrder.forEach(groupName => {
    if (allGroups[groupName] && allGroups[groupName].length > 0) {
      orderedGroups.push({ name: groupName, items: allGroups[groupName] });
    }
  });
  
  // Calculate pagination based on complete groups
  let currentItemCount = 0;
  let startGroupIndex = 0;
  let endGroupIndex = 0;
  
  // Find the starting group for this page
  for (let i = 0; i < orderedGroups.length; i++) {
    const groupItemCount = orderedGroups[i].items.length;
    if (currentItemCount + groupItemCount > (page - 1) * itemsPerPage) {
      startGroupIndex = i;
      break;
    }
    currentItemCount += groupItemCount;
  }
  
  // Find the ending group for this page
  currentItemCount = 0;
  for (let i = 0; i < orderedGroups.length; i++) {
    const groupItemCount = orderedGroups[i].items.length;
    if (currentItemCount + groupItemCount > page * itemsPerPage) {
      endGroupIndex = i;
      break;
    }
    currentItemCount += groupItemCount;
  }
  
  // If we haven't found an end, include all remaining groups
  if (endGroupIndex === 0) {
    endGroupIndex = orderedGroups.length;
  }
  
  // Get the groups for this page
  const pageGroups = orderedGroups.slice(startGroupIndex, endGroupIndex);
  
  // Calculate total pages
  const totalItems = orderedGroups.reduce((sum, group) => sum + group.items.length, 0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Convert back to the expected format
  const result: Record<string, T[]> = {};
  pageGroups.forEach(group => {
    result[group.name] = group.items;
  });
  
  return { groups: result, totalPages, currentPage: page };
}

// Special pagination function for drinks that handles the tagGroups structure
export function paginateDrinksBySubcategories(
  items: MenuItem[],
  getDrinkGroups: (items: MenuItem[]) => { cocktailGroups: Record<string, MenuItem[]>; tagGroups: Record<string, MenuItem[]> },
  drinkGroupOrder: string[],
  page: number,
  itemsPerPage: number
) {
  const { cocktailGroups, tagGroups } = getDrinkGroups(items);
  
  // Merge cocktail groups and tag groups
  const allGroups = { ...cocktailGroups, ...tagGroups };
  
  // Create ordered groups based on drink group order
  const orderedGroups: Array<{ name: string; items: MenuItem[] }> = [];
  drinkGroupOrder.forEach(groupName => {
    if (allGroups[groupName] && allGroups[groupName].length > 0) {
      orderedGroups.push({ name: groupName, items: allGroups[groupName] });
    }
  });
  
  // Calculate pagination based on complete groups
  let currentItemCount = 0;
  let startGroupIndex = 0;
  let endGroupIndex = 0;
  
  // Find the starting group for this page
  for (let i = 0; i < orderedGroups.length; i++) {
    const groupItemCount = orderedGroups[i].items.length;
    if (currentItemCount + groupItemCount > (page - 1) * itemsPerPage) {
      startGroupIndex = i;
      break;
    }
    currentItemCount += groupItemCount;
  }
  
  // Find the ending group for this page
  currentItemCount = 0;
  for (let i = 0; i < orderedGroups.length; i++) {
    const groupItemCount = orderedGroups[i].items.length;
    if (currentItemCount + groupItemCount > page * itemsPerPage) {
      endGroupIndex = i;
      break;
    }
    currentItemCount += groupItemCount;
  }
  
  // If we haven't found an end, include all remaining groups
  if (endGroupIndex === 0) {
    endGroupIndex = orderedGroups.length;
  }
  
  // Get the groups for this page
  const pageGroups = orderedGroups.slice(startGroupIndex, endGroupIndex);
  
  // Calculate total pages
  const totalItems = orderedGroups.reduce((sum, group) => sum + group.items.length, 0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Convert back to the expected format
  const result: Record<string, MenuItem[]> = {};
  pageGroups.forEach(group => {
    result[group.name] = group.items;
  });
  
  return { tagGroups: result, totalPages, currentPage: page };
} 