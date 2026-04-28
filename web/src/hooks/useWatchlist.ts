import { useEffect, useState } from 'react'
import { type Watchlist } from '../lib/schema'
import { loadWatchlist } from '../lib/watchlist'

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadWatchlist()
      .then((data) => {
        if (cancelled) return
        setWatchlist(data)
        setError(null)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { watchlist, error, loading }
}
