-- Supabase Database Setup for Enterprise Orders
-- Run these SQL commands in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create industry_profile table (exact schema provided)
CREATE TABLE IF NOT EXISTS public.industry_profile (
    company_id uuid NOT NULL,
    company_name character varying(100) NOT NULL,
    industry_type character varying(100) NOT NULL,
    "Contact_person" text NOT NULL,
    email_address character varying NULL,
    phone_no character varying NULL,
    company_size character varying NULL,
    "Budget" bigint NULL,
    CONSTRAINT industry_profile_pkey PRIMARY KEY (company_id),
    CONSTRAINT industry_profile_company_id_fkey FOREIGN KEY (company_id) 
        REFERENCES users (user_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Enable Row Level Security on industry_profile
ALTER TABLE public.industry_profile ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own profile (company_id = auth.uid)
CREATE POLICY "Users can view own profile" ON public.industry_profile
    FOR SELECT USING (auth.uid() = company_id);

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.industry_profile
    FOR INSERT WITH CHECK (auth.uid() = company_id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.industry_profile
    FOR UPDATE USING (auth.uid() = company_id);

-- Create industry_order table (exact schema provided)
CREATE TABLE IF NOT EXISTS public.industry_order (
    order_id uuid NOT NULL DEFAULT gen_random_uuid (),
    industry_id uuid NOT NULL,
    material_type text NULL,
    quantity numeric(9, 2) NULL,
    price numeric(9, 4) NULL,
    delivery_details text NULL,
    "City" text NULL,
    "PIN_code" text NULL,
    "Prefered_Delivery_Date" date NULL,
    "Person_name" text NULL,
    phone_no character varying NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT industry_order_pkey PRIMARY KEY (order_id),
    CONSTRAINT industry_order_industry_id_key UNIQUE (industry_id),
    CONSTRAINT industry_order_industry_id_fkey FOREIGN KEY (industry_id) 
        REFERENCES industry_profile (company_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Enable Row Level Security on industry_order
ALTER TABLE public.industry_order ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their order (one order per industry)
CREATE POLICY "Users can view own order" ON public.industry_order
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.industry_profile 
            WHERE industry_profile.company_id = industry_order.industry_id 
            AND industry_profile.company_id = auth.uid()
        )
    );

-- Create policy for users to insert order (one per industry)
CREATE POLICY "Users can insert own order" ON public.industry_order
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.industry_profile 
            WHERE industry_profile.company_id = industry_order.industry_id 
            AND industry_profile.company_id = auth.uid()
        )
    );

-- Create policy for users to update their order
CREATE POLICY "Users can update own order" ON public.industry_order
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.industry_profile 
            WHERE industry_profile.company_id = industry_order.industry_id 
            AND industry_profile.company_id = auth.uid()
        )
    );

-- Create policy for users to delete their order
CREATE POLICY "Users can delete own order" ON public.industry_order
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.industry_profile 
            WHERE industry_profile.company_id = industry_order.industry_id 
            AND industry_profile.company_id = auth.uid()
        )
    );
