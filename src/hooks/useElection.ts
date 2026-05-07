import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Election } from '@/types/database.types'

export function useElection(id: string) {
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('elections')
          .select('*')
          .eq('id', id)
          .single() as any as { data: Election | null, error: any }

        if (err) throw err
        setElection(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id, supabase])

  return { election, loading, error }
}
