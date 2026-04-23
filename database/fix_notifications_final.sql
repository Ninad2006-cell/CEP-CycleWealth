-- FINAL FIX for notification system
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Create notifications table if missing
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
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
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ============================================
-- STEP 2: Drop all existing notification policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications for others" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notifications;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.notifications;

-- ============================================
-- STEP 3: Create correct RLS policies
-- ============================================

-- Policy 1: Anyone can view their own notifications
CREATE POLICY "Enable select for users based on user_id" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can INSERT notifications for ANY user
-- This is the KEY policy that allows enterprise to notify scrap dealers
CREATE POLICY "Enable insert for authenticated users only" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Users can only update their own notifications
CREATE POLICY "Enable update for users based on user_id" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy 4: Users can only delete their own notifications
CREATE POLICY "Enable delete for users based on user_id" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Grant permissions
-- ============================================
GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;

-- ============================================
-- STEP 5: Fix users table RLS to allow reading roles
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated read user roles" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Allow authenticated users to read other users' basic info (needed to find scrap dealers)
CREATE POLICY "Enable read access for all users" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

-- ============================================
-- STEP 6: Add status column to industry_order if missing
-- ============================================
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS assigned_dealer_id UUID REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_industry_order_status ON public.industry_order(status);
CREATE INDEX IF NOT EXISTS idx_industry_order_assigned_dealer ON public.industry_order(assigned_dealer_id);

-- ============================================
-- STEP 7: Fix industry_order RLS policies
-- ============================================
DROP POLICY IF EXISTS "Scrap dealers can view pending orders" ON public.industry_order;
DROP POLICY IF EXISTS "Scrap dealers can accept orders" ON public.industry_order;

-- Allow scrap dealers to view all pending orders
CREATE POLICY "Scrap dealers can view pending orders" 
ON public.industry_order
FOR SELECT USING (
    status = 'pending' 
    OR assigned_dealer_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.industry_profile 
        WHERE industry_profile.company_id = industry_order.industry_id 
        AND industry_profile.company_id = auth.uid()
    )
);

-- Allow scrap dealers to accept orders
CREATE POLICY "Scrap dealers can accept orders" 
ON public.industry_order
FOR UPDATE USING (
    status = 'pending' 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.user_id = auth.uid() 
        AND users.role = 'ScrapDealer'
    )
);

-- ============================================
-- STEP 8: Create function to test notification insert
-- ============================================
CREATE OR REPLACE FUNCTION test_notification_insert()
RETURNS TEXT AS $$
DECLARE
    test_user_id UUID;
    test_result TEXT;
BEGIN
    -- Get first scrap dealer
    SELECT user_id INTO test_user_id FROM users WHERE role = 'ScrapDealer' LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RETURN 'ERROR: No scrap dealers found in database!';
    END IF;
    
    -- Try to insert a test notification
    INSERT INTO notifications (user_id, message, type)
    VALUES (test_user_id, 'Test notification from SQL', 'system');
    
    RETURN 'SUCCESS: Notification inserted for scrap dealer: ' || test_user_id;
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the test
SELECT test_notification_insert();
