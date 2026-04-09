# Enterprise Order Backend Setup

This backend connects the Enterprise Order page with Supabase database.

## Database Schema

### Tables Created

1. **industry_profile** - Stores enterprise registration details
   - `company_id` (UUID, Primary Key)
   - `user_id` (UUID, references auth.users)
   - `company_name`, `contact_person`, `email`, `phone`
   - `company_size`, `industry_type`, `budget_range`
   - `created_at`, `updated_at`

2. **industry_order** - Stores scrap material orders (per your schema)
   - `order_id` (UUID, Primary Key)
   - `industry_id` (UUID, Foreign Key → industry_profile.company_id)
   - `material_type` (Text)
   - `quantity` (Numeric)
   - `price` (Numeric)
   - `created_at`, `updated_at`

## Setup Instructions

### 1. Configure Environment Variables

Ensure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### 2. Run SQL Setup

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase_setup.sql`
3. Run the SQL commands

### 3. Files Created/Modified

**New Files:**
- `src/services/enterpriseService.js` - Supabase CRUD operations
- `supabase_setup.sql` - Database schema

**Modified Files:**
- `src/pages/Enterprise.jsx` - Now saves to `industry_profile` table
- `src/pages/CompanyOrder.jsx` - Now saves to `industry_order` table

## API Functions

### Enterprise Service (`enterpriseService.js`)

| Function | Description |
|----------|-------------|
| `createOrGetIndustryProfile(profileData)` | Creates or retrieves enterprise profile |
| `getIndustryProfile()` | Gets current user's profile |
| `createIndustryOrder(orderData)` | Creates a new order |
| `getIndustryOrders()` | Gets all orders for current user |
| `deleteIndustryOrder(orderId)` | Deletes an order |

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Foreign key constraints ensure data integrity

## Usage Flow

1. User registers on `/enterprise` → Creates `industry_profile` record
2. User places order on `/companyorder` → Creates `industry_order` record(s)
3. Orders linked to profile via `industry_id` foreign key
