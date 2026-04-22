-- Fix sold values to ensure products show correctly

-- Set sold = 0 for all Available products
UPDATE public.upcycled_products 
SET sold = 0 
WHERE status = 'Available' OR sold IS NULL;

-- Only set sold = quantity for products that are actually Sold
UPDATE public.upcycled_products 
SET sold = quantity 
WHERE status = 'Sold';

-- Verify the fix
SELECT name, status, quantity, sold, (quantity - sold) as available_stock
FROM public.upcycled_products;
