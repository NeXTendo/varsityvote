import type { Database } from './database.types'

export type Election = Database['public']['Tables']['elections']['Row']
export type ElectionInsert = Database['public']['Tables']['elections']['Insert']
export type ElectionUpdate = Database['public']['Tables']['elections']['Update']

export type ElectionStatus = Database['public']['Enums']['election_status']

export interface ElectionWithCounts extends Election {
  _count?: {
    candidates: number
    votes: number
  }
}
