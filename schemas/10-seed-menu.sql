-- This file contains comprehensive menu data matching the actual TypeScript structure

INSERT INTO menu_categories (name, description, sort_order) VALUES
('Drinks', 'All beverages including cocktails, beer, wine, and non-alcoholic drinks', 1),
('Food', 'All food items including appetizers, main courses, and desserts', 2),
('Shisha', 'Hookah and shisha options with various flavors', 3);

-- Drinks subcategories (matching TypeScript data)
INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Non-Alcoholic Drinks', 'Coffee, tea, juices, and soft drinks', 1
FROM menu_categories mc WHERE mc.name = 'Drinks';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Alcoholic Drinks', 'Beer, wine, spirits, and cocktails', 2
FROM menu_categories mc WHERE mc.name = 'Drinks';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Cocktails', 'Mixed drinks and cocktails', 3
FROM menu_categories mc WHERE mc.name = 'Drinks';

-- Food subcategories (matching TypeScript data)
INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Pancakes', 'Sweet and savory pancakes', 1
FROM menu_categories mc WHERE mc.name = 'Food';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Eggs', 'Egg-based dishes', 2
FROM menu_categories mc WHERE mc.name = 'Food';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Pizza', 'Italian pizzas', 3
FROM menu_categories mc WHERE mc.name = 'Food';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Salads', 'Fresh salads', 4
FROM menu_categories mc WHERE mc.name = 'Food';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Snacks', 'Light snacks and sandwiches', 5
FROM menu_categories mc WHERE mc.name = 'Food';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Pastry', 'Sweet pastries and baked goods', 6
FROM menu_categories mc WHERE mc.name = 'Food';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Desserts', 'Sweet desserts and treats', 7
FROM menu_categories mc WHERE mc.name = 'Food';

-- Shisha subcategories (matching TypeScript data)
INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Flavors', 'Individual shisha flavors', 1
FROM menu_categories mc WHERE mc.name = 'Shisha';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Offers', 'Special shisha packages', 2
FROM menu_categories mc WHERE mc.name = 'Shisha';

INSERT INTO menu_subcategories (category_id, name, description, sort_order) 
SELECT mc.id, 'Extra Enjoy', 'Additional shisha enhancements', 3
FROM menu_categories mc WHERE mc.name = 'Shisha';

INSERT INTO menu_tags (name, color) VALUES
('Coffee', '#8B4513'),
('Tea', '#228B22'),
('Chocolate', '#8B4513'),
('Fresh Drinks', '#32CD32'),
('Soft Drinks', '#FF6347'),
('Beer', '#FFD700'),
('Wine', '#8B0000'),
('White', '#F5F5DC'),
('Red', '#8B0000'),
('Rosé', '#FFB6C1'),
('Champagne', '#FFD700'),
('Vodka', '#F0F8FF'),
('Whiskey', '#8B4513'),
('Bourbon', '#8B4513'),
('Gin', '#F0F8FF'),
('Tequila', '#32CD32'),
('Rum', '#FFD700'),
('Cognac', '#8B4513'),
('Liqueur', '#FF69B4'),
('Classic', '#4169E1'),
('Signature', '#FF4500'),
('Mocktail', '#32CD32'),
('Popular', '#10B981'),
('New', '#3B82F6'),
('Premium', '#F97316'),
('Age Restricted', '#DC2626');

-- Function to insert menu items with proper category/subcategory references
CREATE OR REPLACE FUNCTION insert_menu_item(
    item_name TEXT,
    item_description TEXT,
    category_name TEXT,
    subcategory_name TEXT,
    item_price DECIMAL(10,2),
    item_cost DECIMAL(10,2),
    item_tags TEXT[],
    item_requires_age_verification BOOLEAN DEFAULT false,
    item_min_age INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO menu_items (
        name, description, category_id, subcategory_id, 
        price, cost, tags, is_available, is_featured, 
        requires_age_verification, min_age
    )
    SELECT 
        item_name, item_description, mc.id, msc.id,
        item_price, item_cost, item_tags, true, false,
        item_requires_age_verification, item_min_age
    FROM menu_categories mc
    JOIN menu_subcategories msc ON msc.category_id = mc.id
    WHERE mc.name = category_name AND msc.name = subcategory_name;
END;
$$ LANGUAGE plpgsql;

-- Coffee
SELECT insert_menu_item('Espresso', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Coffee']);
SELECT insert_menu_item('Espresso Lungo', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Coffee']);
SELECT insert_menu_item('Espresso Ristretto', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Coffee']);
SELECT insert_menu_item('Espresso Decaf', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Coffee']);
SELECT insert_menu_item('Double Espresso', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.40, 0.80, ARRAY['Coffee']);
SELECT insert_menu_item('Freddo Espresso', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.60, 0.85, ARRAY['Coffee']);
SELECT insert_menu_item('Machiatto', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.65, ARRAY['Coffee']);
SELECT insert_menu_item('Ice Latte', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.70, 0.90, ARRAY['Coffee']);
SELECT insert_menu_item('Cappuccino', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.65, ARRAY['Coffee']);
SELECT insert_menu_item('Freddo Cappuccino', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 3.00, 1.00, ARRAY['Coffee']);
SELECT insert_menu_item('Mochaccino', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.50, 0.80, ARRAY['Coffee']);
SELECT insert_menu_item('Affogato', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 4.00, 1.50, ARRAY['Coffee']);
SELECT insert_menu_item('Irish Coffee', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 5.00, 2.00, ARRAY['Coffee'], true, 18);

-- Chocolate
SELECT insert_menu_item('Hot Chocolate', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 3.00, 1.00, ARRAY['Chocolate']);
SELECT insert_menu_item('Flavored Chocolate', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 3.50, 1.20, ARRAY['Chocolate']);
SELECT insert_menu_item('Viennois Chocolate', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 4.00, 1.40, ARRAY['Chocolate']);

-- Tea
SELECT insert_menu_item('Chamomile Tea', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Tea']);
SELECT insert_menu_item('Mint Tea', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Tea']);
SELECT insert_menu_item('Earl Grey', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Tea']);
SELECT insert_menu_item('Herbs of Olympus (Herbal Blend)', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Tea']);
SELECT insert_menu_item('Forest Fruit Tea', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 1.80, 0.60, ARRAY['Tea']);

-- Fresh Juices
SELECT insert_menu_item('Fresh Orange Juice', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 3.00, 1.00, ARRAY['Fresh Drinks']);
SELECT insert_menu_item('Fresh Mixed Juice', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 3.50, 1.20, ARRAY['Fresh Drinks']);
SELECT insert_menu_item('Fresh Lemon Juice', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 3.20, 1.10, ARRAY['Fresh Drinks']);
SELECT insert_menu_item('Fruit Smoothie', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 4.00, 1.40, ARRAY['Fresh Drinks']);

-- Soft Drinks
SELECT insert_menu_item('Coca-Cola', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Fanta Orange', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Schweppes Tonic', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Iced Tea', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Red Bull', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 3.00, 1.20, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Coca-Cola Zero', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Schweppes Bitter Lemon', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Schweppes Tangerine', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Orange Juice', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Apple Juice', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);
SELECT insert_menu_item('Peach Juice', 'Delicious and freshly prepared.', 'Drinks', 'Non-Alcoholic Drinks', 2.00, 0.70, ARRAY['Soft Drinks']);

-- Beer
SELECT insert_menu_item('Draft Lager', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 2.00, 0.80, ARRAY['Beer'], true, 18);
SELECT insert_menu_item('Heineken', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 3.70, 1.50, ARRAY['Beer'], true, 18);
SELECT insert_menu_item('Karlsberg', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 3.30, 1.30, ARRAY['Beer'], true, 18);
SELECT insert_menu_item('Amstel', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 3.00, 1.20, ARRAY['Beer'], true, 18);
SELECT insert_menu_item('Amstel Radler', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 3.00, 1.20, ARRAY['Beer'], true, 18);
SELECT insert_menu_item('Corona', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 4.00, 1.60, ARRAY['Beer'], true, 18);
SELECT insert_menu_item('Non Alcoholic Beer', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 3.00, 1.20, ARRAY['Beer'], false, 0);

-- Wine
SELECT insert_menu_item('House White Wine (glass)', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 3.00, 1.20, ARRAY['Wine', 'White'], true, 18);
SELECT insert_menu_item('Chardonnay', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 15.00, 6.00, ARRAY['Wine', 'White'], true, 18);
SELECT insert_menu_item('Sauvignon Blanc', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 17.00, 6.80, ARRAY['Wine', 'White'], true, 18);
SELECT insert_menu_item('House Red Wine (glass)', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 3.00, 1.20, ARRAY['Wine', 'Red'], true, 18);
SELECT insert_menu_item('Merlot', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 15.00, 6.00, ARRAY['Wine', 'Red'], true, 18);
SELECT insert_menu_item('Syrah', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 17.00, 6.80, ARRAY['Wine', 'Red'], true, 18);
SELECT insert_menu_item('Pinot Noir', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 18.00, 7.20, ARRAY['Wine', 'Red'], true, 18);
SELECT insert_menu_item('House Rosé Wine (glass)', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 3.00, 1.20, ARRAY['Wine', 'Rosé'], true, 18);
SELECT insert_menu_item('Grenache', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 15.00, 6.00, ARRAY['Wine', 'Rosé'], true, 18);
SELECT insert_menu_item('Shiraz', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 17.00, 6.80, ARRAY['Wine', 'Rosé'], true, 18);
SELECT insert_menu_item('Moët Chandon Imperial', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 35.00, 14.00, ARRAY['Champagne'], true, 18);
SELECT insert_menu_item('Prosecco', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 7.50, 3.00, ARRAY['Champagne'], true, 18);

-- Spirits
SELECT insert_menu_item('Absolut', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 8.00, 3.20, ARRAY['Vodka'], true, 18);
SELECT insert_menu_item('Smirnoff', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 8.00, 3.20, ARRAY['Vodka'], true, 18);
SELECT insert_menu_item('Beluga', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 11.00, 4.40, ARRAY['Vodka'], true, 18);
SELECT insert_menu_item('Belvedere', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 11.00, 4.40, ARRAY['Vodka'], true, 18);
SELECT insert_menu_item('Gray Goose', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Vodka'], true, 18);
SELECT insert_menu_item('Famous Grouse', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 8.00, 3.20, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Tullamore Dew', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 8.00, 3.20, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Jameson', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 10.00, 4.00, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Jameson Black Label', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Johnnie Walker', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 10.00, 4.00, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Johnnie Walker Black Label', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Johhnie Walker Gold Label', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 14.00, 5.60, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Glenfiddich 12', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 16.00, 6.40, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Chivas Regal', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 16.00, 6.40, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Macallan 12', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 18.00, 7.20, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Chivas Regal 25', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 60.00, 24.00, ARRAY['Whiskey'], true, 18);
SELECT insert_menu_item('Jack Daniels', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 11.00, 4.40, ARRAY['Bourbon'], true, 18);
SELECT insert_menu_item('Jack Daniels Honey', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 11.00, 4.40, ARRAY['Bourbon'], true, 18);
SELECT insert_menu_item('Four Roses', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Bourbon'], true, 18);
SELECT insert_menu_item('Bombay Sapphire', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Gin'], true, 18);
SELECT insert_menu_item('Hendricks', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Gin'], true, 18);
SELECT insert_menu_item('Gordons', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Gin'], true, 18);
SELECT insert_menu_item('Tanqueray', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Gin'], true, 18);
SELECT insert_menu_item('Bulldog', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 10.00, 4.00, ARRAY['Gin'], true, 18);
SELECT insert_menu_item('Olmeca', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 8.00, 3.20, ARRAY['Tequila'], true, 18);
SELECT insert_menu_item('Don Julio Blanco', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Tequila'], true, 18);
SELECT insert_menu_item('Don Julio Reposado', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Tequila'], true, 18);
SELECT insert_menu_item('Don Julio Anejo', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Tequila'], true, 18);
SELECT insert_menu_item('Bacardi', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Rum'], true, 18);
SELECT insert_menu_item('Havana 3 Anos', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Rum'], true, 18);
SELECT insert_menu_item('Havana Reserva', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 10.00, 4.00, ARRAY['Rum'], true, 18);
SELECT insert_menu_item('Captain Morgan White', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Rum'], true, 18);
SELECT insert_menu_item('Captain Morgan Spice Gold', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Rum'], true, 18);
SELECT insert_menu_item('Captain Morgan Dark', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Rum'], true, 18);
SELECT insert_menu_item('Don Papa', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Rum'], true, 18);
SELECT insert_menu_item('Hennessy V.S', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Cognac'], true, 18);
SELECT insert_menu_item('Remy Cointreau Martin V.S', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 12.00, 4.80, ARRAY['Cognac'], true, 18);
SELECT insert_menu_item('Jägermeister', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Liqueur'], true, 18);
SELECT insert_menu_item('Amaro', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Liqueur'], true, 18);
SELECT insert_menu_item('Aperol', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Liqueur'], true, 18);
SELECT insert_menu_item('Campari', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Liqueur'], true, 18);
SELECT insert_menu_item('Kahlua', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Liqueur'], true, 18);
SELECT insert_menu_item('Baileys', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Liqueur'], true, 18);
SELECT insert_menu_item('Limoncello', 'Delicious and freshly prepared.', 'Drinks', 'Alcoholic Drinks', 9.00, 3.60, ARRAY['Liqueur'], true, 18);

-- Classic Cocktails
SELECT insert_menu_item('Mojito', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Old Fashioned', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Margarita', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Cosmopolitan', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Negroni', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Bramble', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Cuba Libre', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Daquiry', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Aperol Spriz', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Hugo', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Long Island', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Espresso Martini', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Old Fashion', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);
SELECT insert_menu_item('Gin Tonic', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Classic'], true, 18);

-- Signature Cocktails
SELECT insert_menu_item('Spicy Sunset', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 11.00, 4.40, ARRAY['Signature'], true, 18);
SELECT insert_menu_item('Spicy Mexican', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 11.00, 4.40, ARRAY['Signature'], true, 18);
SELECT insert_menu_item('Blueberry Smash', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 11.00, 4.40, ARRAY['Signature'], true, 18);
SELECT insert_menu_item('Tropicano', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 11.00, 4.40, ARRAY['Signature'], true, 18);
SELECT insert_menu_item('Bright Night', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 11.00, 4.40, ARRAY['Signature'], true, 18);
SELECT insert_menu_item('Gentlemans Drink', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 11.00, 4.40, ARRAY['Signature'], true, 18);

-- Mocktails
SELECT insert_menu_item('Virgin Mojito', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Mocktail'], false, 0);
SELECT insert_menu_item('Strawberry Fizz', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Mocktail'], false, 0);
SELECT insert_menu_item('Spritz Non Alcohol', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Mocktail'], false, 0);
SELECT insert_menu_item('Summer Vibes', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Mocktail'], false, 0);
SELECT insert_menu_item('Punch', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Mocktail'], false, 0);
SELECT insert_menu_item('Pink Panther', 'Delicious and freshly prepared.', 'Drinks', 'Cocktails', 10.00, 4.00, ARRAY['Mocktail'], false, 0);

-- Food

-- Pancakes
SELECT insert_menu_item('Salty Pancake', 'Delicious and freshly prepared.', 'Food', 'Pancakes', 9.00, 3.60, ARRAY[]);
SELECT insert_menu_item('Egg Pancake', 'Delicious and freshly prepared.', 'Food', 'Pancakes', 9.00, 3.60, ARRAY[]);
SELECT insert_menu_item('Sweet Pancake', 'Delicious and freshly prepared.', 'Food', 'Pancakes', 8.50, 3.40, ARRAY[]);

-- Eggs
SELECT insert_menu_item('Omelette', 'Delicious and freshly prepared.', 'Food', 'Eggs', 8.00, 3.20, ARRAY[]);
SELECT insert_menu_item('Scrambled Eggs', 'Delicious and freshly prepared.', 'Food', 'Eggs', 8.00, 3.20, ARRAY[]);
SELECT insert_menu_item('Fried Eggs', 'Delicious and freshly prepared.', 'Food', 'Eggs', 8.00, 3.20, ARRAY[]);

-- Pizza
SELECT insert_menu_item('Margarita', 'Delicious and freshly prepared.', 'Food', 'Pizza', 10.00, 4.00, ARRAY[]);
SELECT insert_menu_item('Special', 'Delicious and freshly prepared.', 'Food', 'Pizza', 12.00, 4.80, ARRAY[]);
SELECT insert_menu_item('Chicken', 'Delicious and freshly prepared.', 'Food', 'Pizza', 13.00, 5.20, ARRAY[]);

-- Salads
SELECT insert_menu_item('Caesars Salad', 'Delicious and freshly prepared.', 'Food', 'Salads', 12.00, 4.80, ARRAY[]);
SELECT insert_menu_item('Salad Caprese', 'Delicious and freshly prepared.', 'Food', 'Salads', 11.00, 4.40, ARRAY[]);
SELECT insert_menu_item('Greek Salad', 'Delicious and freshly prepared.', 'Food', 'Salads', 10.00, 4.00, ARRAY[]);

-- Snacks
SELECT insert_menu_item('Toast', 'Delicious and freshly prepared.', 'Food', 'Snacks', 6.00, 2.40, ARRAY[]);
SELECT insert_menu_item('Club Sandwich', 'Delicious and freshly prepared.', 'Food', 'Snacks', 9.00, 3.60, ARRAY[]);
SELECT insert_menu_item('Chicken Nuggets', 'Delicious and freshly prepared.', 'Food', 'Snacks', 9.00, 3.60, ARRAY[]);
SELECT insert_menu_item('Variety of Cheese and Cold Meat', 'Delicious and freshly prepared.', 'Food', 'Snacks', 16.00, 6.40, ARRAY[]);

-- Pastry
SELECT insert_menu_item('Croissant with Chocolate Cream', 'Delicious and freshly prepared.', 'Food', 'Pastry', 6.00, 2.40, ARRAY[]);
SELECT insert_menu_item('Croissant with Pastry Cream', 'Delicious and freshly prepared.', 'Food', 'Pastry', 6.00, 2.40, ARRAY[]);
SELECT insert_menu_item('Savory Butter Croissant', 'Delicious and freshly prepared.', 'Food', 'Pastry', 6.00, 2.40, ARRAY[]);

-- Desserts
SELECT insert_menu_item('Cheesecake', 'Delicious and freshly prepared.', 'Food', 'Desserts', 7.50, 3.00, ARRAY[]);
SELECT insert_menu_item('Choco Cake', 'Delicious and freshly prepared.', 'Food', 'Desserts', 7.50, 3.00, ARRAY[]);
SELECT insert_menu_item('Lava Cake', 'Delicious and freshly prepared.', 'Food', 'Desserts', 8.50, 3.40, ARRAY[]);
SELECT insert_menu_item('Chocolate Souffle', 'Delicious and freshly prepared.', 'Food', 'Desserts', 7.00, 2.80, ARRAY[]);
SELECT insert_menu_item('Ice Cream Scoop', 'Delicious and freshly prepared.', 'Food', 'Desserts', 3.00, 1.20, ARRAY[]);

-- Shisha

-- Flavors
SELECT insert_menu_item('Grape, Mint', 'Delicious and freshly prepared.', 'Shisha', 'Flavors', 20.00, 8.00, ARRAY[], true, 18);
SELECT insert_menu_item('Tripple Passion', 'Delicious and freshly prepared.', 'Shisha', 'Flavors', 25.00, 10.00, ARRAY[], true, 18);
SELECT insert_menu_item('Sweet Breeze', 'Delicious and freshly prepared.', 'Shisha', 'Flavors', 20.00, 8.00, ARRAY[], true, 18);

-- Offers
SELECT insert_menu_item('Twin Shisha', 'Delicious and freshly prepared.', 'Shisha', 'Offers', 30.00, 12.00, ARRAY[], true, 18);
SELECT insert_menu_item('Special Shisha', 'Delicious and freshly prepared.', 'Shisha', 'Offers', 35.00, 14.00, ARRAY[], true, 18);

-- Extra Enjoy
SELECT insert_menu_item('Fruit Mix and Mint Leaves (in the jar)', 'Delicious and freshly prepared.', 'Shisha', 'Extra Enjoy', 5.00, 2.00, ARRAY[], true, 18);
SELECT insert_menu_item('Grapefruit or Orange (Hookah bowl)', 'Delicious and freshly prepared.', 'Shisha', 'Extra Enjoy', 5.00, 2.00, ARRAY[], true, 18);
SELECT insert_menu_item('Strong Flavor (+6-7gr)', 'Delicious and freshly prepared.', 'Shisha', 'Extra Enjoy', 5.00, 2.00, ARRAY[], true, 18);

-- Drop the helper function
DROP FUNCTION IF EXISTS insert_menu_item(TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, TEXT[], BOOLEAN, INTEGER); 