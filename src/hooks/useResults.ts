import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Result {
  candidate_id: string
  full_name: string
  position: string
  vote_count: number
}

export function useResults(electionId: string) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .rpc('get_results', { p_election_id: electionId }) as any

        if (err) throw err
        setResults(data || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (electionId) load()
  }, [electionId, supabase])

  return { results, loading, error }
}
