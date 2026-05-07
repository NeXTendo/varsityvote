import type { Database } from './database.types'

export type Candidate = Database['public']['Tables']['candidates']['Row']
export type CandidateInsert = Database['public']['Tables']['candidates']['Insert']
export type CandidateUpdate = Database['public']['Tables']['candidates']['Update']

export type CandidateStatus = Database['public']['Enums']['candidate_status']

export interface CandidateWithProfile extends Candidate {
  profiles: {
    full_name: string
    avatar_url: string | null
    student_id: string | null
  }
}
