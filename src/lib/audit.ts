'use server'
import { createClient } from './supabase/server'
import type { Database } from '@/types/database.types'

export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export async function getAuditLogs(options: { 
  institutionId?: string | null, 
  userId?: string | null,
  limit?: number 
} = {}) {
  const { institutionId, userId, limit = 50 } = options
  const supabase = await createClient()
  
  let query = supabase
    .from('audit_logs')
    .select('*, profiles(full_name, email), institutions(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (institutionId) {
    query = query.eq('institution_id', institutionId)
  }

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query as any as { data: any[] | null, error: any }

  if (error) throw new Error(error.message)
  return data || []
}


export async function logAction(action: Database['public']['Enums']['audit_action'], metadata: any = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Fetch institution_id from metadata or profile
  let institutionId = metadata.institution_id
  if (!institutionId) {
    const { data: profile } = await supabase.from('profiles').select('institution_id').eq('id', user.id).single()
    institutionId = profile?.institution_id
  }

  await supabase.rpc('log_audit_event', {
    p_institution_id: institutionId,
    p_actor_id: user.id,
    p_action: action,
    p_metadata: metadata
  })
}
