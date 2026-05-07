// Auto-generated types from Supabase schema
// Run: npm run db:types to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          domain: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          domain?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          institution_id: string | null
          full_name: string
          student_id: string | null
          email: string
          role: Database['public']['Enums']['user_role']
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          institution_id?: string | null
          full_name: string
          student_id?: string | null
          email: string
          role?: Database['public']['Enums']['user_role']
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      elections: {
        Row: {
          id: string
          institution_id: string
          created_by: string
          title: string
          description: string | null
          category: Database['public']['Enums']['election_category']
          scope_id: string | null
          registration_deadline: string | null
          status: Database['public']['Enums']['election_status']
          voting_start: string | null
          voting_end: string | null
          results_visible: boolean
          max_votes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          created_by: string
          title: string
          description?: string | null
          status?: Database['public']['Enums']['election_status']
          voting_start?: string | null
          voting_end?: string | null
          results_visible?: boolean
          max_votes?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['elections']['Insert']>
      }
      candidates: {
        Row: {
          id: string
          election_id: string
          profile_id: string
          election_position_id: string
          status: Database['public']['Enums']['candidate_status']
          bio: string | null
          manifesto: string | null
          manifesto_url: string | null
          photo_url: string | null
          video_url: string | null
          vote_count: number
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          election_id: string
          profile_id: string
          position: string
          status?: Database['public']['Enums']['candidate_status']
          bio?: string | null
          manifesto?: string | null
          manifesto_url?: string | null
          photo_url?: string | null
          video_url?: string | null
          vote_count?: number
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['candidates']['Insert']>
      }
      vote_tokens: {
        Row: {
          id: string
          election_id: string
          voter_id: string
          token: string
          used: boolean
          issued_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          election_id: string
          voter_id: string
          token?: string
          used?: boolean
          issued_at?: string
          used_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['vote_tokens']['Insert']>
      }
      votes: {
        Row: {
          id: string
          election_id: string
          candidate_id: string
          token_id: string
          vote_hash: string
          election_position_id: string
          cast_at: string
        }
        Insert: {
          id?: string
          election_id: string
          candidate_id: string
          token_id: string
          vote_hash: string
          election_position_id: string
          cast_at?: string
        }
        Update: never
      }
      election_positions: {
        Row: {
          id: string
          election_id: string
          title: string
          description: string | null
          max_candidates: number
          max_winners: number
          eligibility_rules: Json
          voting_method: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          election_id: string
          title: string
          description?: string | null
          max_candidates?: number
          max_winners?: number
          eligibility_rules?: Json
          voting_method?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['election_positions']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          institution_id: string | null
          actor_id: string | null
          action: Database['public']['Enums']['audit_action']
          target_type: string | null
          target_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          actor_id?: string | null
          action: Database['public']['Enums']['audit_action']
          target_type?: string | null
          target_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      issue_vote_token: {
        Args: { p_election_id: string }
        Returns: { token: string; already_used: boolean }[]
      }
      cast_vote: {
        Args: {
          p_election_id: string
          p_candidate_id: string
          p_token: string
          p_position: string
        }
        Returns: Json
      }
      get_results: {
        Args: { p_election_id: string }
        Returns: {
          candidate_id: string
          candidate_name: string
          position: string
          photo_url: string | null
          vote_count: number
          percentage: number
          is_winner: boolean
        }[]
      }
      current_institution_id: { Args: Record<never, never>; Returns: string }
      current_role: { Args: Record<never, never>; Returns: Database['public']['Enums']['user_role'] }
    }
    Enums: {
      election_category: 'university' | 'faculty' | 'department' | 'club' | 'hostel' | 'class'
      user_role: 'super_admin' | 'election_admin' | 'candidate' | 'voter'
      election_status: 'draft' | 'active' | 'closed' | 'results_published' | 'cancelled'
      candidate_status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
      audit_action:
        | 'election_created'
        | 'election_updated'
        | 'election_status_changed'
        | 'candidate_registered'
        | 'candidate_approved'
        | 'candidate_rejected'
        | 'vote_token_issued'
        | 'vote_cast'
        | 'results_published'
        | 'user_role_changed'
        | 'login_success'
        | 'login_failed'
    }
  }
}

// Convenience type aliases
export type Institution = Database['public']['Tables']['institutions']['Row']
export type Profile     = Database['public']['Tables']['profiles']['Row']
export type Election    = Database['public']['Tables']['elections']['Row']
export type Candidate   = Database['public']['Tables']['candidates']['Row']
export type VoteToken   = Database['public']['Tables']['vote_tokens']['Row']
export type Vote        = Database['public']['Tables']['votes']['Row']
export type AuditLog    = Database['public']['Tables']['audit_logs']['Row']
export type UserRole    = Database['public']['Enums']['user_role']
export type ElectionStatus   = Database['public']['Enums']['election_status']
export type CandidateStatus  = Database['public']['Enums']['candidate_status']
export type ElectionPosition = Database['public']['Tables']['election_positions']['Row']
export type ElectionCategory = Database['public']['Enums']['election_category']
export type AuditAction      = Database['public']['Enums']['audit_action']

export type ElectionResult = {
  candidate_id: string
  candidate_name: string
  position: string
  photo_url: string | null
  vote_count: number
  percentage: number
  is_winner: boolean
}