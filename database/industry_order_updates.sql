-- Add columns to industry_order table for order tracking and dealer assignment

-- Add status column to track order state
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Add assigned_dealer_id column to track which scrap dealer accepted the order
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS assigned_dealer_id UUID REFERENCES users(user_id) ON DELETE SET NULL;

-- Add fulfillment_notes column for dealer to add notes when accepting
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;

-- Add updated_at column to track when order was last modified
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_industry_order_status ON public.industry_order(status);

-- Create index on assigned_dealer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_industry_order_assigned_dealer ON public.industry_order(assigned_dealer_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_industry_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_industry_order_timestamp ON public.industry_order;

CREATE TRIGGER update_industry_order_timestamp
    BEFORE UPDATE ON public.industry_order
    FOR EACH ROW
    EXECUTE FUNCTION update_industry_order_updated_at();

-- Update RLS policies to allow scrap dealers to view pending orders
-- Policy: Allow scrap dealers to view pending orders
CREATE POLICY "Scrap dealers can view pending orders" ON public.industry_order
    FOR SELECT USING (
        status = 'pending' OR
        assigned_dealer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.industry_profile 
            WHERE industry_profile.company_id = industry_order.industry_id 
            AND industry_profile.company_id = auth.uid()
        )
    );

-- Policy: Allow scrap dealers to update orders when accepting
CREATE POLICY "Scrap dealers can accept orders" ON public.industry_order
    FOR UPDATE USING (
        status = 'pending' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.user_id = auth.uid() 
            AND users.role = 'ScrapDealer'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.industry_order TO authenticated;
GRANT UPDATE (assigned_dealer_id, status, fulfillment_notes) ON public.industry_order TO authenticated;
