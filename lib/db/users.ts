import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import type { AdminUser, AdminRole } from '@/types'

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, role, is_active, created_at, updated_at')
    .eq('id', id)
    .single()
  return data ?? null
}

export async function getAdminUserByEmail(email: string): Promise<(AdminUser & { password_hash: string }) | null> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, role, is_active, created_at, updated_at, password_hash')
    .eq('email', email.toLowerCase().trim())
    .single()
  return data ?? null
}

export async function createAdminUser(input: {
  name: string
  email: string
  password: string
  role: AdminRole
}): Promise<AdminUser> {
  const password_hash = await bcrypt.hash(input.password, 12)
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .insert({
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      password_hash,
      role: input.role,
      is_active: true,
    })
    .select('id, name, email, role, is_active, created_at, updated_at')
    .single()
  if (error) throw error
  return data
}

export async function updateAdminUser(id: string, input: {
  name?: string
  email?: string
  password?: string
  role?: AdminRole
  is_active?: boolean
}): Promise<AdminUser> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name)      update.name = input.name.trim()
  if (input.email)     update.email = input.email.toLowerCase().trim()
  if (input.role)      update.role = input.role
  if (input.is_active !== undefined) update.is_active = input.is_active
  if (input.password)  update.password_hash = await bcrypt.hash(input.password, 12)

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .update(update)
    .eq('id', id)
    .select('id, name, email, role, is_active, created_at, updated_at')
    .single()
  if (error) throw error
  return data
}

export async function verifyAdminPassword(email: string, password: string): Promise<AdminUser | null> {
  const user = await getAdminUserByEmail(email)
  if (!user || !user.is_active) return null
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _, ...safe } = user
  return safe
}

export async function countAdminUsers(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('admin_users')
    .select('*', { count: 'exact', head: true })
  return count ?? 0
}

// Per-user stats: how many sites created + total cost
export async function getAdminUserStats(userId: string): Promise<{ sites_count: number; sites_cost: number }> {
  const { data } = await supabaseAdmin
    .from('clients')
    .select('cost_usd')
    .eq('created_by', userId)
  const sites_count = data?.length ?? 0
  const sites_cost = data?.reduce((sum, c) => sum + (c.cost_usd ?? 0), 0) ?? 0
  return { sites_count, sites_cost }
}
