import { createClient } from './supabase/client'

export async function castVote(electionId: string, candidateId: string, token: string, position: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('cast_vote', {
    p_election_id: electionId,
    p_candidate_id: candidateId,
    p_token: token,
    p_position: position
  }) as any

  if (error) throw new Error(error.message)
  return data
}

export async function issueVoteToken(electionId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('issue_vote_token', {
    p_election_id: electionId
  }) as any

  if (error) throw new Error(error.message)
  return data?.[0]?.token
}

export async function getResults(electionId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('get_results', {
    p_election_id: electionId
  }) as any

  if (error) throw new Error(error.message)
  return data || []
}
