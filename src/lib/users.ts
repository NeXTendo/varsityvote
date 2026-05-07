'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

export async function getUserById(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*, institutions(name)')
    .eq('id', userId)
    .single() as any

  if (error) throw new Error(error.message)
  return data
}


export async function createUser(data: {
  email: string
  fullName: string
  role: UserRole
  institutionId?: string | null
}) {
  const admin = await createAdminClient()
  
  // Default password logic: first 2 letters of email + 12345
  const defaultPassword = data.email.substring(0, 2) + "12345"
  
  // 1. Create the auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: { full_name: data.fullName },
    password: defaultPassword
  })

  if (authError) {
    console.error('Auth creation error:', authError)
    return { error: authError.message }
  }

  // 2. Update profile with require_password_change
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: data.fullName,
      role: data.role,
      institution_id: data.institutionId || null,
      require_password_change: true
    })
    .eq('id', authUser.user.id) as any

  if (profileError) {
    console.error('Profile update error:', profileError)
    return { error: profileError.message }
  }

  revalidatePath('/super-admin/users')
  return { success: true, userId: authUser.user.id }
}

export async function updateUserDetails(
  userId: string,
  data: {
    fullName?: string
    role?: UserRole
    institutionId?: string | null
  }
) {
  const supabase = await createClient()
  
  const updateData: any = {}
  if (data.fullName) updateData.full_name = data.fullName
  if (data.role) updateData.role = data.role
  if ('institutionId' in data) updateData.institution_id = data.institutionId || null

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId) as any

  if (error) {
    console.error('Error updating user:', error)
    return { error: error.message }
  }

  revalidatePath(`/super-admin/users/${userId}`)
  revalidatePath('/super-admin/users')
  return { success: true }
}

export async function updateUserRole(
  userId: string, 
  role: UserRole, 
  institutionId?: string | null
) {
  return updateUserDetails(userId, { role, institutionId })
}
