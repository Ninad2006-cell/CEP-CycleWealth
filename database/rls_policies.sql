-- Enable RLS policies for orders and order_items tables

-- Enable RLS on my_orders table (if not already enabled)
ALTER TABLE public.my_orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customers table (if not already enabled)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own orders from my_orders
CREATE POLICY "Allow users to view their my_orders"
ON public.my_orders
FOR SELECT
TO authenticated
USING (customer_details = auth.uid());

-- Policy: Allow users to insert their own orders to my_orders
CREATE POLICY "Allow users to insert their my_orders"
ON public.my_orders
FOR INSERT
TO authenticated
WITH CHECK (customer_details = auth.uid());

-- Policy: Allow users to view their own customer profile
CREATE POLICY "Allow users to view their customer profile"
ON public.customers
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Policy: Allow users to insert/update their own customer profile
CREATE POLICY "Allow users to upsert their customer profile"
ON public.customers
FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Policy: Allow authenticated users to insert their own orders
CREATE POLICY "Allow authenticated users to insert orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (buyer_id = auth.uid());

-- Policy: Allow authenticated users to view their own orders
CREATE POLICY "Allow users to view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (buyer_id = auth.uid());

-- Policy: Allow users to update their own orders (for cancellations)
CREATE POLICY "Allow users to update their own orders" 
ON public.orders 
FOR UPDATE 
TO authenticated 
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- Policy: Allow authenticated users to insert order items
CREATE POLICY "Allow authenticated users to insert order items" 
ON public.order_items 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Allow users to view order items for their orders
CREATE POLICY "Allow users to view their order items" 
ON public.order_items 
FOR SELECT 
TO authenticated 
USING (
    order_id IN (
        SELECT order_id FROM public.orders WHERE buyer_id = auth.uid()
    )
);
