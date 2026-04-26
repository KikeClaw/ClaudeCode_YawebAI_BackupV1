import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// supabaseAdmin uses the service_role key — it bypasses Row Level Security.
// All routes that use this client are protected at the proxy layer (proxy.ts).
// To add defense in depth, enable RLS on all tables in the Supabase dashboard
// and create policies that allow service_role full access.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
