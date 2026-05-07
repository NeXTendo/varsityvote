'use server'
import { createClient } from './supabase/server'
import type { Database } from '@/types/database.types'

export type Candidate = Database['public']['Tables']['candidates']['Row']

export async function getCandidates(electionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('candidates')
    .select('*, profiles!candidates_profile_id_fkey(full_name, avatar_url, student_id)')
    .eq('election_id', electionId)
    .order('position') as any as { data: (Candidate & { profiles: any })[] | null, error: any }

  if (error) throw new Error(error.message)
  return data || []
}

export async function approveCandidate(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('candidates')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function rejectCandidate(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('candidates')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}


export async function reviewCandidate(id: string, status: 'approved' | 'rejected', reviewerId: string) {
  const supabase = await createClient()
  
  // Get the candidate first to know their institution (for audit logs)
  const { data: candidate } = await supabase
    .from('candidates')
    .select('*, elections(institution_id)')
    .eq('id', id)
    .single() as any

  // Update candidate status and audit fields
  const updateData: any = { status, updated_at: new Date().toISOString() }
  if (status === 'approved') {
    updateData.approved_by = reviewerId
    updateData.approved_at = new Date().toISOString()
  }

  const { error: candidateError } = await supabase
    .from('candidates')
    .update(updateData)
    .eq('id', id)

  if (candidateError) throw new Error(candidateError.message)

  // Log the action via RPC (security definer) to bypass RLS
  const { error: logError } = await supabase.rpc('log_audit_event', {
    p_institution_id: candidate?.elections?.institution_id,
    p_actor_id: reviewerId,
    p_action: status === 'approved' ? 'candidate_approved' : 'candidate_rejected',
    p_target_type: 'candidate',
    p_target_id: id,
    p_metadata: { status, position: candidate?.position }
  })

  if (logError) console.error('Failed to log candidate review:', logError)

  // Revalidate to show changes
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/candidates')
  revalidatePath('/admin/dashboard')
}
