-- Fix RLS policies for notifications table to allow enterprise order notifications

-- First, check if the notifications table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Create notifications table if it doesn't exist
        CREATE TABLE public.notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'system',
            is_read BOOLEAN DEFAULT false,
            data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        -- Create indexes
        CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
        CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
    END IF;
END $$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications for others" ON public.notifications;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert notifications for any user
-- This is needed for enterprise orders to notify scrap dealers
CREATE POLICY "Allow authenticated users to insert notifications" ON public.notifications
    FOR INSERT TO authenticated 
    WITH CHECK (true);

-- Policy: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;

-- Also fix RLS for users table to allow reading scrap dealer roles
-- This is needed for the notification system to find scrap dealers
DROP POLICY IF EXISTS "Allow public read access to scrap dealers" ON public.users;

-- Policy: Allow authenticated users to read user roles (needed for finding scrap dealers)
CREATE POLICY "Allow authenticated read user roles" ON public.users
    FOR SELECT TO authenticated 
    USING (true);

-- Fix industry_order RLS policies for scrap dealer access
DROP POLICY IF EXISTS "Scrap dealers can view pending orders" ON public.industry_order;
DROP POLICY IF EXISTS "Scrap dealers can accept orders" ON public.industry_order;

-- Policy: Allow scrap dealers to view all pending orders
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
