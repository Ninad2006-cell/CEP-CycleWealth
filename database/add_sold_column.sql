-- Add sold column to upcycled_products table
ALTER TABLE public.upcycled_products 
ADD COLUMN IF NOT EXISTS sold integer DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_upcycled_products_sold 
ON public.upcycled_products (sold);

-- Initialize sold values based on status
-- Products with status 'Sold' get sold = quantity
UPDATE public.upcycled_products 
SET sold = quantity 
WHERE status = 'Sold' AND sold = 0;
