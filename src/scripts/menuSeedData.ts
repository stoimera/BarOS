import { MenuItem } from '@/types/menu';

export const menuSeedData: Omit<MenuItem, 'id' | 'created_at'>[] = [
  // Drinks - Non-Alcoholic - Coffee
  { name: 'Espresso', description: 'A concentrated shot of rich, aromatic coffee made from freshly ground Arabica beans. Contains caffeine.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Espresso Lungo', description: 'A longer espresso shot with a milder flavor, made from freshly ground Arabica beans. Contains caffeine.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Espresso Ristretto', description: 'A short, intense espresso shot with a bold flavor. Contains caffeine.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Espresso Decaf', description: 'A decaffeinated espresso shot, offering the same rich flavor without the caffeine.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Double Espresso', description: 'Two shots of espresso for a stronger, more robust coffee experience. Contains caffeine.', price: 2.40, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Freddo Espresso', description: 'Chilled double espresso served over ice for a refreshing coffee experience. Contains caffeine.', price: 2.60, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Machiatto', description: 'Espresso topped with a small amount of frothy milk. Contains caffeine and dairy.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Ice Latte', description: 'Espresso poured over cold milk and ice, lightly sweetened. Contains caffeine and dairy.', price: 2.70, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Cappuccino', description: 'Classic Italian coffee with espresso, steamed milk, and a thick layer of milk foam. Creamy and smooth.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Freddo Cappuccino', description: 'Chilled cappuccino with espresso, cold milk, and frothy foam, served over ice. Contains caffeine and dairy.', price: 3.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Mochaccino', description: 'A blend of espresso, steamed milk, and chocolate, topped with milk foam. Contains caffeine and dairy.', price: 2.50, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Affogato', description: 'A scoop of vanilla ice cream "drowned" with a shot of hot espresso. Contains caffeine and dairy.', price: 4.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },
  { name: 'Irish Coffee', description: 'Hot coffee blended with Irish whiskey, sugar, and topped with cream. Contains alcohol and dairy.', price: 5.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Coffee'], is_available: true },

  // Drinks - Non-Alcoholic - Chocolate
  { name: 'Hot Chocolate', description: 'Rich hot chocolate made with real cocoa and steamed milk, topped with whipped cream.', price: 3.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Chocolate'], is_available: true },
  { name: 'Flavored Chocolate', description: 'Hot chocolate infused with your choice of flavors (vanilla, caramel, or hazelnut), topped with whipped cream.', price: 3.50, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Chocolate'], is_available: true },
  { name: 'Viennois Chocolate', description: 'Luxurious hot chocolate topped with a generous swirl of whipped cream. Contains dairy.', price: 4.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Chocolate'], is_available: true },

  // Drinks - Non-Alcoholic - Tea
  { name: 'Chamomile Tea', description: 'Soothing herbal tea made from chamomile flowers. Naturally caffeine-free. Vegan, gluten-free.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Tea'], is_available: true },
  { name: 'Mint Tea', description: 'Refreshing herbal tea brewed with fresh mint leaves. Naturally caffeine-free. Vegan, gluten-free.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Tea'], is_available: true },
  { name: 'Earl Grey', description: 'Classic black tea infused with bergamot citrus. Contains caffeine. Vegan, gluten-free.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Tea'], is_available: true },
  { name: 'Herbs of Olympus (Herbal Blend)', description: 'A fragrant blend of Greek mountain herbs, naturally caffeine-free. Vegan, gluten-free.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Tea'], is_available: true },
  { name: 'Forest Fruit Tea', description: 'Fruity herbal tea with a blend of forest berries and hibiscus. Naturally caffeine-free. Vegan, gluten-free.', price: 1.80, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Tea'], is_available: true },

  // Drinks - Non-Alcoholic - Juices
  { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice, served chilled. 100% fruit, no added sugar. Vegan, gluten-free.', price: 3.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Fresh Drinks'], is_available: true },
  { name: 'Fresh Mixed Juice', description: 'A blend of freshly squeezed seasonal fruits. Vegan, gluten-free.', price: 3.50, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Fresh Drinks'], is_available: true },
  { name: 'Fresh Lemon Juice', description: 'Freshly squeezed lemon juice, served over ice. Vegan, gluten-free.', price: 3.20, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Fresh Drinks'], is_available: true },
  { name: 'Fruit Smoothie', description: 'A creamy blend of fresh fruits and juice. Vegan, gluten-free. Ask for ingredients.', price: 4.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Fresh Drinks'], is_available: true },

  // Drinks - Non-Alcoholic - Soft Drinks
  { name: 'Coca-Cola', description: 'Classic cola soft drink. Served chilled. Contains caffeine.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Fanta Orange', description: 'Orange-flavored carbonated soft drink. Served chilled.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Schweppes Tonic', description: 'Bitter lemon-flavored tonic water. Served chilled.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Iced Tea', description: 'Chilled black tea with a hint of lemon. Contains caffeine.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Red Bull', description: 'Energy drink with caffeine and taurine. Served chilled.', price: 3.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Coca-Cola Zero', description: 'Sugar-free cola soft drink. Served chilled. Contains caffeine.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Schweppes Bitter Lemon', description: 'Bitter lemon-flavored carbonated drink. Served chilled.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Schweppes Tangerine', description: 'Tangerine-flavored carbonated drink. Served chilled.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Orange Juice', description: 'Chilled orange juice. Vegan, gluten-free.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Apple Juice', description: 'Chilled apple juice. Vegan, gluten-free.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },
  { name: 'Peach Juice', description: 'Chilled peach juice. Vegan, gluten-free.', price: 2.00, category: 'Drinks', subcategory: 'Non-Alcoholic Drinks', image_url: '', tags: ['Soft Drinks'], is_available: true },

  // Drinks - Alcoholic - Beers
  { name: 'Draft Lager', description: 'Light, crisp draft lager beer. Served cold. Contains alcohol and gluten.', price: 2.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Beer'], is_available: true },
  { name: 'Heineken', description: 'Premium Dutch lager beer. Served cold. Contains alcohol and gluten.', price: 3.70, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Beer'], is_available: true },
  { name: 'Karlsberg', description: 'German-style lager beer. Served cold. Contains alcohol and gluten.', price: 3.30, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Beer'], is_available: true },
  { name: 'Amstel', description: 'Dutch lager beer. Served cold. Contains alcohol and gluten.', price: 3.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Beer'], is_available: true },
  { name: 'Amstel Radler', description: 'Lager beer mixed with lemon soda. Refreshing and light. Contains alcohol and gluten.', price: 3.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Beer'], is_available: true },
  { name: 'Corona', description: 'Mexican pale lager beer. Served with a wedge of lime. Contains alcohol and gluten.', price: 4.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Beer'], is_available: true },
  { name: 'Non Alcoholic Beer', description: 'Alcohol-free lager beer. Served cold. Contains gluten.', price: 3.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Beer'], is_available: true },

  // Drinks - Alcoholic - Wines (White, Red, Rosé, Champagne)
  { name: 'House White Wine (glass)', description: 'A glass of crisp, house white wine. Served chilled. Contains alcohol.', price: 3.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'White'], is_available: true },
  { name: 'Chardonnay', description: 'Full-bodied white wine with notes of apple and vanilla. Contains alcohol.', price: 15.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'White'], is_available: true },
  { name: 'Sauvignon Blanc', description: 'Crisp, refreshing white wine with citrus and green apple notes. Contains alcohol.', price: 17.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'White'], is_available: true },
  { name: 'House Red Wine (glass)', description: 'A glass of smooth, house red wine. Served at room temperature. Contains alcohol.', price: 3.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'Red'], is_available: true },
  { name: 'Merlot', description: 'Medium-bodied red wine with plum and cherry notes. Contains alcohol.', price: 15.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'Red'], is_available: true },
  { name: 'Syrah', description: 'Bold red wine with dark fruit and peppery notes. Contains alcohol.', price: 17.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'Red'], is_available: true },
  { name: 'Pinot Noir', description: 'Light-bodied red wine with red berry flavors. Contains alcohol.', price: 18.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'Red'], is_available: true },
  { name: 'House Rosé Wine (glass)', description: 'A glass of dry, house rosé wine. Served chilled. Contains alcohol.', price: 3.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'Rosé'], is_available: true },
  { name: 'Grenache', description: 'Rosé wine with strawberry and citrus notes. Contains alcohol.', price: 15.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'Rosé'], is_available: true },
  { name: 'Shiraz', description: 'Rosé wine with bold fruit flavors and a hint of spice. Contains alcohol.', price: 17.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Wine', 'Rosé'], is_available: true },
  { name: 'Moët Chandon Imperial', description: 'Premium French champagne with fine bubbles and notes of citrus and brioche. Contains alcohol.', price: 35.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Champagne'], is_available: true },
  { name: 'Prosecco', description: 'Italian sparkling wine with crisp, fruity notes. Contains alcohol.', price: 7.50, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Champagne'], is_available: true },

  // Drinks - Alcoholic - Spirits (Vodka, Whiskey, Bourbon, Gin, Tequila, Rum, Cognac, Liqueur)
  { name: 'Absolut', description: 'Swedish vodka, smooth and clean. Served neat or in cocktails. Contains alcohol.', price: 8.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Vodka'], is_available: true },
  { name: 'Smirnoff', description: 'Classic vodka, ideal for mixing in cocktails. Contains alcohol.', price: 8.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Vodka'], is_available: true },
  { name: 'Beluga', description: 'Premium Russian vodka, exceptionally smooth. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Vodka'], is_available: true },
  { name: 'Belvedere', description: 'Polish rye vodka, smooth and elegant. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Vodka'], is_available: true },
  { name: 'Gray Goose', description: 'French premium vodka, soft and clean. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Vodka'], is_available: true },
  { name: 'Famous Grouse', description: 'Blended Scotch whisky with a smooth, malty flavor. Contains alcohol.', price: 8.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Tullamore Dew', description: 'Irish whiskey, triple-distilled for smoothness. Contains alcohol.', price: 8.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Jameson', description: 'Famous Irish whiskey, smooth and versatile. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Jameson Black Label', description: 'Aged Irish whiskey with rich, complex flavors. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Johnnie Walker', description: 'Blended Scotch whisky, smooth and smoky. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Johnnie Walker Black Label', description: 'Aged Scotch whisky with deep, smoky flavors. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Johhnie Walker Gold Label', description: 'Premium blended Scotch whisky with honeyed notes. Contains alcohol.', price: 14.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Glenfiddich 12', description: 'Single malt Scotch whisky, aged 12 years. Fruity and smooth. Contains alcohol.', price: 16.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Chivas Regal', description: 'Blended Scotch whisky, rich and smooth. Contains alcohol.', price: 16.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Macallan 12', description: 'Single malt Scotch whisky, aged 12 years. Rich and complex. Contains alcohol.', price: 18.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Chivas Regal 25', description: 'Aged blended Scotch whisky, luxurious and smooth. Contains alcohol.', price: 60.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Whiskey'], is_available: true },
  { name: 'Jack Daniels', description: 'Tennessee whiskey, mellowed for smoothness. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Bourbon'], is_available: true },
  { name: 'Jack Daniels Honey', description: 'Tennessee whiskey blended with honey liqueur. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Bourbon'], is_available: true },
  { name: 'Four Roses', description: 'Kentucky straight bourbon whiskey, smooth and mellow. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Bourbon'], is_available: true },
  { name: 'Bombay Sapphire', description: 'London dry gin with a blend of botanicals. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Gin'], is_available: true },
  { name: "Hendrick's", description: 'Premium gin infused with cucumber and rose. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Gin'], is_available: true },
  { name: 'Gordons', description: 'Classic London dry gin. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Gin'], is_available: true },
  { name: 'Tanqueray', description: 'London dry gin with a crisp, juniper-forward flavor. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Gin'], is_available: true },
  { name: 'Bulldog', description: 'Modern gin with a blend of botanicals. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Gin'], is_available: true },
  { name: 'Olmeca', description: 'Mexican tequila, smooth and vibrant. Contains alcohol.', price: 8.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Tequila'], is_available: true },
  { name: 'Don Julio Blanco', description: 'Premium blanco tequila, crisp and clean. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Tequila'], is_available: true },
  { name: 'Don Julio Reposado', description: 'Aged tequila with smooth, mellow flavors. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Tequila'], is_available: true },
  { name: 'Don Julio Anejo', description: 'Aged tequila with rich, complex flavors. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Tequila'], is_available: true },
  { name: 'Bacardi', description: 'White rum, light and versatile. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Rum'], is_available: true },
  { name: 'Havana 3 Anos', description: 'Aged Cuban rum, smooth and flavorful. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Rum'], is_available: true },
  { name: 'Havana Reserva', description: 'Premium Cuban rum, rich and complex. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Rum'], is_available: true },
  { name: 'Captain Morgan White', description: 'White rum, smooth and light. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Rum'], is_available: true },
  { name: 'Captain Morgan Spice Gold', description: 'Spiced rum with warm, aromatic flavors. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Rum'], is_available: true },
  { name: 'Captain Morgan Dark', description: 'Dark rum with deep, rich flavors. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Rum'], is_available: true },
  { name: 'Don Papa', description: 'Premium Filipino rum, sweet and fruity. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Rum'], is_available: true },
  { name: 'Hennessy V.S', description: 'Cognac with rich, oaky flavors. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Cognac'], is_available: true },
  { name: 'Remy Cointreau Martin V.S', description: 'Smooth French cognac. Contains alcohol.', price: 12.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Cognac'], is_available: true },
  { name: 'Jägermeister', description: 'Herbal liqueur with a blend of 56 botanicals. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Liqueur'], is_available: true },
  { name: 'Amaro', description: 'Italian herbal liqueur, bittersweet and aromatic. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Liqueur'], is_available: true },
  { name: 'Aperol', description: 'Italian aperitif with orange and herbal notes. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Liqueur'], is_available: true },
  { name: 'Campari', description: 'Bitter Italian liqueur with herbal and fruit notes. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Liqueur'], is_available: true },
  { name: 'Kahlua', description: 'Coffee-flavored liqueur from Mexico. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Liqueur'], is_available: true },
  { name: 'Baileys', description: 'Irish cream liqueur with whiskey and chocolate. Contains alcohol and dairy.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Liqueur'], is_available: true },
  { name: 'Limoncello', description: 'Italian lemon liqueur, sweet and tangy. Contains alcohol.', price: 9.00, category: 'Drinks', subcategory: 'Alcoholic Drinks', image_url: '', tags: ['Liqueur'], is_available: true },

  // Drinks - Cocktails
  { name: 'Mojito', description: 'Classic Cuban cocktail with white rum, fresh mint, lime, sugar, and soda water. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Old Fashioned', description: 'Whiskey cocktail with sugar, bitters, and orange peel. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Margarita', description: 'Tequila cocktail with lime juice and triple sec, served with a salted rim. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Cosmopolitan', description: 'Vodka cocktail with cranberry juice, triple sec, and lime. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Negroni', description: 'Italian cocktail with gin, Campari, and sweet vermouth. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Bramble', description: 'Gin cocktail with lemon juice, sugar, and blackberry liqueur. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Cuba Libre', description: 'Rum cocktail with cola and lime. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Daquiry', description: 'Rum cocktail with lime juice and sugar. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Aperol Spriz', description: 'Aperol, prosecco, and soda water over ice. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Hugo', description: 'Elderflower liqueur, prosecco, soda water, and mint. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Long Island', description: 'Vodka, gin, rum, tequila, triple sec, lemon juice, and cola. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Espresso Martini', description: 'Vodka, espresso, coffee liqueur, and sugar syrup. Contains alcohol and caffeine.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Old Fashion', description: 'Whiskey cocktail with sugar, bitters, and orange peel. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },
  { name: 'Spicy Sunset', description: 'Signature cocktail with tequila, chili, lime, and orange liqueur. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Signature'], is_available: true },
  { name: 'Spicy Mexican', description: 'Signature cocktail with mezcal, lime, agave, and chili. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Signature'], is_available: true },
  { name: 'Blueberry Smash', description: 'Signature cocktail with gin, blueberries, lemon, and mint. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Signature'], is_available: true },
  { name: 'Tropicano', description: 'Signature cocktail with rum, pineapple, coconut, and lime. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Signature'], is_available: true },
  { name: 'Bright Night', description: 'Signature cocktail with vodka, elderflower, and citrus. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Signature'], is_available: true },
  { name: "Gentleman's Drink", description: 'Signature cocktail with bourbon, bitters, and orange zest. Contains alcohol.', price: 11.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Signature'], is_available: true },
  { name: 'Virgin Mojito', description: 'Non-alcoholic mojito with fresh mint, lime, sugar, and soda water. Vegan, gluten-free.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Mocktail'], is_available: true },
  { name: 'Strawberry Fizz', description: 'Non-alcoholic cocktail with strawberries, lemon, and soda water. Vegan, gluten-free.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Mocktail'], is_available: true },
  { name: 'Spritz Non Alcohol', description: 'Non-alcoholic spritz with orange, soda, and herbs. Vegan, gluten-free.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Mocktail'], is_available: true },
  { name: 'Summer Vibes', description: 'Non-alcoholic cocktail with tropical fruit juices. Vegan, gluten-free.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Mocktail'], is_available: true },
  { name: 'Punch', description: 'Non-alcoholic fruit punch with a blend of seasonal fruits. Vegan, gluten-free.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Mocktail'], is_available: true },
  { name: 'Pink Panther', description: 'Non-alcoholic cocktail with pink grapefruit and soda. Vegan, gluten-free.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Mocktail'], is_available: true },
  { name: 'Gin Tonic', description: 'Classic gin and tonic with a wedge of lime. Contains alcohol.', price: 10.00, category: 'Drinks', subcategory: 'Cocktails', image_url: '', tags: ['Classic'], is_available: true },

  // Food - Pancakes
  { name: 'Salty Pancake', description: 'Savory pancake filled with cheese and ham. Served warm.', price: 9.00, category: 'Food', subcategory: 'Pancakes', image_url: '', tags: [], is_available: true },
  { name: 'Egg Pancake', description: 'Fluffy pancake with eggs and cheese. Served warm.', price: 9.00, category: 'Food', subcategory: 'Pancakes', image_url: '', tags: [], is_available: true },
  { name: 'Sweet Pancake', description: 'Sweet pancake topped with honey or chocolate. Served warm.', price: 8.50, category: 'Food', subcategory: 'Pancakes', image_url: '', tags: [], is_available: true },

  // Food - Eggs
  { name: 'Omelette', description: 'Three-egg omelette with cheese and herbs. Served with toast.', price: 8.00, category: 'Food', subcategory: 'Eggs', image_url: '', tags: [], is_available: true },
  { name: 'Scrambled Eggs', description: 'Creamy scrambled eggs with butter and herbs. Served with toast.', price: 8.00, category: 'Food', subcategory: 'Eggs', image_url: '', tags: [], is_available: true },
  { name: 'Fried Eggs', description: 'Two fried eggs, cooked to order. Served with toast.', price: 8.00, category: 'Food', subcategory: 'Eggs', image_url: '', tags: [], is_available: true },

  // Food - Pizza
  { name: 'Margarita', description: 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil.', price: 10.00, category: 'Food', subcategory: 'Pizza', image_url: '', tags: [], is_available: true },
  { name: 'Special', description: 'Pizza with tomato sauce, mozzarella, ham, mushrooms, and peppers.', price: 12.00, category: 'Food', subcategory: 'Pizza', image_url: '', tags: [], is_available: true },
  { name: 'Chicken', description: 'Pizza with tomato sauce, mozzarella, and grilled chicken.', price: 13.00, category: 'Food', subcategory: 'Pizza', image_url: '', tags: [], is_available: true },

  // Food - Salads
  { name: "Caesar's Salad", description: 'Crisp romaine lettuce, grilled chicken, croutons, parmesan cheese, and Caesar dressing.', price: 12.00, category: 'Food', subcategory: 'Salads', image_url: '', tags: [], is_available: true },
  { name: 'Salad Caprese', description: 'Fresh mozzarella, tomatoes, and basil, drizzled with olive oil. Vegetarian and gluten-free. Contains dairy.', price: 11.00, category: 'Food', subcategory: 'Salads', image_url: '', tags: [], is_available: true },
  { name: 'Greek Salad', description: 'Tomatoes, cucumbers, Kalamata olives, red onions, and feta cheese, dressed with olive oil and oregano.', price: 10.00, category: 'Food', subcategory: 'Salads', image_url: '', tags: [], is_available: true },

  // Food - Snacks
  { name: 'Toast', description: 'Grilled sandwich with cheese and ham. Served warm.', price: 6.00, category: 'Food', subcategory: 'Snacks', image_url: '', tags: [], is_available: true },
  { name: 'Club Sandwich', description: 'Triple-layered sandwich with roasted chicken, bacon, lettuce, tomato, and mayonnaise. Served with fries.', price: 9.00, category: 'Food', subcategory: 'Snacks', image_url: '', tags: [], is_available: true },
  { name: 'Chicken Nuggets', description: 'Breaded chicken nuggets, served with dipping sauce.', price: 9.00, category: 'Food', subcategory: 'Snacks', image_url: '', tags: [], is_available: true },
  { name: 'Variety of Cheese and Cold Meat', description: 'A selection of cheeses and cured meats. Served with bread.', price: 16.00, category: 'Food', subcategory: 'Snacks', image_url: '', tags: [], is_available: true },

  // Food - Pastry
  { name: 'Croissant with Chocolate Cream', description: 'Flaky croissant filled with rich chocolate cream.', price: 6.00, category: 'Food', subcategory: 'Pastry', image_url: '', tags: [], is_available: true },
  { name: 'Croissant with Pastry Cream', description: 'Flaky croissant filled with sweet pastry cream.', price: 6.00, category: 'Food', subcategory: 'Pastry', image_url: '', tags: [], is_available: true },
  { name: 'Savory Butter Croissant', description: 'Buttery croissant, perfect for breakfast or a snack.', price: 6.00, category: 'Food', subcategory: 'Pastry', image_url: '', tags: [], is_available: true },

  // Food - Desserts
  { name: 'Cheesecake', description: 'Creamy baked cheesecake on a biscuit base, topped with berry compote.', price: 7.50, category: 'Food', subcategory: 'Desserts', image_url: '', tags: [], is_available: true },
  { name: 'Choco Cake', description: 'Rich chocolate cake with a moist texture.', price: 7.50, category: 'Food', subcategory: 'Desserts', image_url: '', tags: [], is_available: true },
  { name: 'Lava Cake', description: 'Warm chocolate cake with a gooey molten center.', price: 8.50, category: 'Food', subcategory: 'Desserts', image_url: '', tags: [], is_available: true },
  { name: 'Chocolate Souffle', description: 'Light, airy chocolate dessert with a soft center.', price: 7.00, category: 'Food', subcategory: 'Desserts', image_url: '', tags: [], is_available: true },
  { name: 'Ice Cream Scoop', description: 'A scoop of creamy ice cream. Ask for available flavors.', price: 3.00, category: 'Food', subcategory: 'Desserts', image_url: '', tags: [], is_available: true },

  // Shisha - Flavors
  { name: 'Grape, Mint', description: 'A sweet and cooling blend of grape and mint shisha tobacco for a refreshing experience.', price: 20.00, category: 'Shisha', subcategory: 'Flavors', image_url: '', tags: [], is_available: true },
  { name: 'Tripple Passion', description: 'A tropical blend of passion fruit flavors for a vibrant shisha session.', price: 25.00, category: 'Shisha', subcategory: 'Flavors', image_url: '', tags: [], is_available: true },
  { name: 'Sweet Breeze', description: 'A smooth, sweet shisha blend with fruity notes.', price: 20.00, category: 'Shisha', subcategory: 'Flavors', image_url: '', tags: [], is_available: true },

  // Shisha - Offers
  { name: 'Twin Shisha', description: 'Two shisha pipes served together for sharing. Choose your favorite flavors.', price: 30.00, category: 'Shisha', subcategory: 'Offers', image_url: '', tags: [], is_available: true },
  { name: 'Special Shisha', description: 'Our signature shisha blend, prepared with fresh fruit in the bowl for extra smoothness.', price: 35.00, category: 'Shisha', subcategory: 'Offers', image_url: '', tags: [], is_available: true },

  // Shisha - Extra Enjoy
  { name: 'Fruit Mix and Mint Leaves (in the jar)', description: 'Add fresh fruit and mint leaves to your shisha jar for enhanced flavor.', price: 5.00, category: 'Shisha', subcategory: 'Extra Enjoy', image_url: '', tags: [], is_available: true },
  { name: 'Grapefruit or Orange (Hookah bowl)', description: 'Enjoy your shisha in a grapefruit or orange bowl for a citrusy twist.', price: 5.00, category: 'Shisha', subcategory: 'Extra Enjoy', image_url: '', tags: [], is_available: true },
  { name: 'Strong Flavor (+6-7gr)', description: 'Extra-strong shisha with an additional 6-7 grams of tobacco for a more intense session.', price: 5.00, category: 'Shisha', subcategory: 'Extra Enjoy', image_url: '', tags: [], is_available: true },
]; 
