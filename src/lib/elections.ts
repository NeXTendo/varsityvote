'use server'
import { createClient } from './supabase/server'
import type { Database } from '@/types/database.types'

export type Election = Database['public']['Tables']['elections']['Row']

export async function getElections(institutionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false }) as any as { data: Election[] | null, error: any }

  if (error) throw new Error(error.message)
  return data || []
}

export async function getElection(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .eq('id', id)
    .single() as any as { data: Election | null, error: any }

  if (error) throw new Error(error.message)
  return data
}

export async function updateElectionStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('elections')
    .update({ status: status as any } as any)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function updateElectionWindow(id: string, start: string | null, end: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('elections')
    .update({ 
      voting_start: start,
      voting_end: end
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}


export async function toggleResultsVisibility(id: string, visible: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('elections')
    .update({ results_visible: visible })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function updateElection(id: string, updates: Partial<Election>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('elections')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/admin/elections/${id}`)
  revalidatePath('/admin/elections')
  revalidatePath('/admin/dashboard')
}
