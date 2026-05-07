import type { Database } from './database.types'

export type VoteToken = Database['public']['Tables']['vote_tokens']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']

export interface VoteTally {
  candidate_id: string
  vote_count: number
}
