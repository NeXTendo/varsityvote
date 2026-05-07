'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInstitution(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const domain = formData.get('domain') as string

  const { error } = await supabase
    .from('institutions')
    .insert([{ name, slug, domain }]) as any

  if (error) {
    console.error('Error creating institution:', error)
    return { error: error.message }
  }

  revalidatePath('/super-admin/institutions')
  revalidatePath('/super-admin/dashboard')
  return { success: true }
}

export async function toggleInstitutionStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('institutions')
    .update({ is_active: !currentStatus })
    .eq('id', id) as any

  if (error) {
    console.error('Error toggling institution status:', error)
    return { error: error.message }
  }

  revalidatePath('/super-admin/institutions')
  revalidatePath('/super-admin/dashboard')
  return { success: true }
}
