import { createClient } from '@supabase/supabase-js'

const supabase_Url = import.meta.env.VITE_SUPABASE_URL
const supabase_key = import.meta.env.VITE_SUPABASE_KEY

const supabaseClient = createClient(
    supabase_Url,
    supabase_key
)

export default supabaseClient