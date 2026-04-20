import { menuSeedData } from './menuSeedData';
import { addMenuItem, getMenuItems } from '@/lib/menu';

async function addMissingMenuItems() {
  try {
    console.log('Fetching existing menu items...');
    const existingItems = await getMenuItems();
    const existingNames = new Set(existingItems.map(item => item.name));
    
    console.log(`Found ${existingItems.length} existing items`);
    console.log(`Existing categories: ${[...new Set(existingItems.map(item => item.category))].join(', ')}`);
    
    const missingItems = menuSeedData.filter(item => !existingNames.has(item.name));
    
    console.log(`Found ${missingItems.length} missing items to add`);
    
    if (missingItems.length === 0) {
      console.log('No missing items found. All items are already seeded.');
      return;
    }
    
    // Group missing items by category
    const missingByCategory = missingItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof missingItems>);
    
    console.log('Missing items by category:');
    Object.entries(missingByCategory).forEach(([category, items]) => {
      console.log(`  ${category}: ${items.length} items`);
    });
    
    // Add missing items
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of missingItems) {
      try {
        await addMenuItem(item);
        console.log(`Added: ${item.name} (${item.category})`);
        successCount++;
      } catch (err) {
        console.error(`Error adding ${item.name}:`, err);
        errorCount++;
      }
    }
    
    console.log(`\nSeeding complete.`);
    console.log(`Successfully added: ${successCount} items`);
    console.log(`Errors: ${errorCount} items`);
    
    if (successCount > 0) {
      console.log('\nYou can now refresh your menu page to see the new items!');
    }
    
  } catch (error) {
    console.error('Error in addMissingMenuItems:', error);
  }
}

addMissingMenuItems(); 