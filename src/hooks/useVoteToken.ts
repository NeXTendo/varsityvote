import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useVoteToken(electionId: string) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .rpc('issue_vote_token', { p_election_id: electionId }) as any

        if (err) throw err
        if (data?.[0]) {
          setToken(data[0].token)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (electionId) load()
  }, [electionId, supabase])

  return { token, loading, error }
}
